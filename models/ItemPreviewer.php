<?php
/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoQtiTestPreviewer\models;

use common_Exception;
use common_exception_InconsistentData;
use common_exception_NotFound;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\service\ConfigurableService;
use oat\taoDelivery\model\RuntimeService;
use oat\taoItems\model\pack\ItemPack;
use oat\taoItems\model\pack\Packer;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiItem\model\qti\Service;
use oat\taoQtiItem\model\QtiJsonItemCompiler;
use oat\taoQtiTest\models\container\QtiTestDeliveryContainer;
use OutOfBoundsException;
use OutOfRangeException;
use qtism\common\datatypes\files\FileManagerException;
use qtism\common\datatypes\files\FileSystemFileManager;
use qtism\data\storage\StorageException;
use qtism\data\storage\xml\XmlDocument;
use qtism\runtime\common\State;
use qtism\runtime\common\Variable;
use qtism\runtime\tests\AssessmentItemSession;
use qtism\runtime\tests\AssessmentItemSessionException;
use qtism\runtime\tests\SessionManager;
use RuntimeException;
use taoQtiCommon_helpers_PciStateOutput;
use taoQtiCommon_helpers_PciVariableFiller;
use taoQtiCommon_helpers_ResultTransmissionException;
use taoQtiCommon_helpers_Utils;

class ItemPreviewer extends ConfigurableService
{
    use OntologyAwareTrait;

    /**
     * @var string
     */
    private $userLanguage;

    /**
     * @var string
     */
    private $itemDefinition;

    /**
     * @var \core_kernel_classes_Resource
     */
    private $delivery;

    /**
     * @var \tao_models_classes_service_FileStorage
     */
    private $fileStorage;

    /**
     * @var string
     */
    private $itemUri;

    /**
     * @var \tao_models_classes_service_StorageDirectory
     */
    private $itemPublicDir;

    /**
     * @var \tao_models_classes_service_StorageDirectory
     */
    private $itemPrivateDir;

    /**
     * @var array
     */
    private $itemHrefs = [];

    public function __construct()
    {
        $this->fileStorage = \tao_models_classes_service_FileStorage::singleton();
    }

    /**
     * @param string $userLanguage
     * @return ItemPreviewer
     */
    public function setUserLanguage($userLanguage)
    {
        $this->userLanguage = $userLanguage;

        return $this;
    }

    /**
     * @param string $itemDefinition
     * @return ItemPreviewer
     */
    public function setItemDefinition($itemDefinition)
    {
        $this->itemDefinition = $itemDefinition;

        return $this;
    }

    /**
     * @param \core_kernel_classes_Resource $delivery
     * @return ItemPreviewer
     * @throws \common_exception_NotFound
     */
    public function setDelivery($delivery)
    {
        if (!$delivery->exists()) {
            throw new \common_exception_NotFound('Delivery "'. $delivery->getUri() .'" not found');
        }

        $this->delivery = $delivery;

        return $this;
    }

    private function validateProperties()
    {
        if (empty($this->userLanguage)
            || empty($this->itemDefinition)
            || empty($this->delivery)
        ) {
            throw new \LogicException('UserLanguage, ItemDefiniton and Delivery are mandatory for loading of compiled item data');
        }
    }

    /**
     * @return array
     *
     * @throws \common_Exception
     * @throws \common_exception_Error
     * @throws \common_exception_InconsistentData
     * @throws \common_exception_NotFound
     */
    public function loadCompiledItemData()
    {
        $this->validateProperties();

        $jsonFile = $this->getItemPrivateDir()->getFile($this->userLanguage . DIRECTORY_SEPARATOR . QtiJsonItemCompiler::ITEM_FILE_NAME);
        $xmlFile = $this->getItemPrivateDir()->getFile($this->userLanguage . DIRECTORY_SEPARATOR . Service::QTI_ITEM_FILE);

        if ($jsonFile->exists()) {
            // new test runner is used
            $itemData = json_decode($jsonFile->read(), true);
        } elseif ($xmlFile->exists()) {
            // old test runner is used
            /** @var Packer $packer */
            $packer = (new Packer(new \core_kernel_classes_Resource($this->getItemUri()), $this->userLanguage))
                ->setServiceLocator($this->getServiceLocator());

            /** @var ItemPack $itemPack */
            $itemPack = $packer->pack();

            $itemData = $itemPack->JsonSerialize();
        } else {
            throw new common_exception_NotFound('Either item.json or qti.xml should exist');
        }

        return $itemData;
    }

    /**
     * @return mixed
     * @throws common_exception_InconsistentData
     * @throws common_exception_NotFound
     */
    public function loadCompiledItemVariables()
    {
        $this->validateProperties();

        $variableElements = $this->getItemPrivateDir()->getFile($this->userLanguage . DIRECTORY_SEPARATOR . QtiJsonItemCompiler::VAR_ELT_FILE_NAME);

        if (!$variableElements->exists()) {
            throw new common_exception_NotFound('File variableElements.json should exist');
        }

        $variablesData = json_decode($variableElements->read(), true);

        return $variablesData;
    }

    /**
     * @return string
     * @throws \common_Exception
     * @throws \common_exception_Error
     * @throws \common_exception_InconsistentData
     */
    public function getBaseUrl()
    {
        return $this->getItemPublicDir()->getPublicAccessUrl() . $this->userLanguage . '/';
    }

    /**
     * Item's ResponseProcessing.
     *
     * @param string $itemUri
     * @param array $jsonPayload
     * @return array
     * @throws FileManagerException
     * @throws common_Exception
     */
    public function processResponses($itemUri, $jsonPayload){
        if (empty($itemUri)) {
            throw new common_Exception('missing required itemUri');
        }

        $item = $this->getResource($itemUri['itemUri']);
        $qtiXmlDoc = $this->getQtiXmlDoc($item);
        $itemSession = $this->getItemSession($qtiXmlDoc);
        $filler = $this->getVariableFilter($qtiXmlDoc);
        $variables = $this->getQtiSmVariables($filler, $jsonPayload);

        try {
            $itemSession->beginAttempt();
            $itemSession->endAttempt(new State($variables));

            // Return the item session state to the client-side.
            return [
                'success' => true,
                'displayFeedback' => true,
                'itemSession' => self::buildOutcomeResponse($itemSession)
            ];
        }
        catch(AssessmentItemSessionException $e) {
            $msg = "An error occurred while processing the responses.";
            throw new RuntimeExceptionAlias($msg, 0, $e);
        }
        catch(taoQtiCommon_helpers_ResultTransmissionException $e) {
            $msg = "An error occurred while transmitting a result to the target Result Server.";
            throw new RuntimeExceptionAlias($msg, 0, $e);
        }
    }

    /**
     * Convert client-side data as QtiSm Runtime Variables
     * @param taoQtiCommon_helpers_PciVariableFiller $filler
     * @throws FileManagerException
     * @return Variable[]
     */
    private function getQtiSmVariables($filler, $jsonPayload)
    {
        $variables = array();

        foreach ($jsonPayload as $id => $response) {
            try {
                $var = $filler->fill($id, $response);
                // Do not take into account QTI Files at preview time.
                // Simply delete the created file.
                if (taoQtiCommon_helpers_Utils::isQtiFile($var, false) === true) {
                    $fileManager = new FileSystemFileManager();
                    $fileManager->delete($var->getValue());
                }
                else {
                    $variables[] = $var;
                }
            }
            catch (OutOfRangeException $e) {
                // A variable value could not be converted, ignore it.
                // Developer's note: QTI Pairs with a single identifier (missing second identifier of the pair) are transmitted as an array of length 1,
                // this might cause problem. Such "broken" pairs are simply ignored.
                $this->logDebug("Client-side value for variable '${id}' is ignored due to data malformation.");
            }
            catch (OutOfBoundsException $e) {
                // No such identifier found in item.
                $this->logDebug("The variable with identifier '${id}' is not declared in the item definition.");
            }
        }

        return $variables;
    }


    /**
     * @param XmlDocument $qtiXmlDoc
     * @return taoQtiCommon_helpers_PciVariableFiller
     */
    private function getVariableFilter($qtiXmlDoc)
    {
        return new taoQtiCommon_helpers_PciVariableFiller($qtiXmlDoc->getDocumentComponent());
    }

    /**
     * @param XmlDocument $qtiXmlDoc
     * @return AssessmentItemSession
     */
    private function getItemSession($qtiXmlDoc)
    {
        $itemSession = new AssessmentItemSession($qtiXmlDoc->getDocumentComponent(), new SessionManager());
        $itemSession->beginItemSession();

        return $itemSession;
    }

    /**
     * @param \core_kernel_classes_Resource $item
     * @return XmlDocument
     * @throws common_Exception
     */
    private function getQtiXmlDoc($item)
    {
        try {
            $qtiXmlFileContent = QtiFile::getQtiFileContent($item);
            $qtiXmlDoc = new XmlDocument();
            $qtiXmlDoc->loadFromString($qtiXmlFileContent);
        }
        catch(StorageException $e) {
            $msg = "An error occurred while loading QTI-XML file at expected location '${qtiXmlFilePath}'.";
            $this->logError(($e->getPrevious() !== null) ? $e->getPrevious()->getMessage() : $e->getMessage());
            throw new RuntimeException($msg, 0, $e);
        }

        return $qtiXmlDoc;
    }

    protected function buildOutcomeResponse(AssessmentItemSession $itemSession) {
        $stateOutput = new taoQtiCommon_helpers_PciStateOutput();

        foreach ($itemSession->getOutcomeVariables(false) as $var) {
            $stateOutput->addVariable($var);
        }

        $output = $stateOutput->getOutput();
        return $output;
    }




    /**
     * @return \tao_models_classes_service_StorageDirectory
     * @throws \common_exception_InconsistentData
     */
    private function getItemPublicDir()
    {
        if (is_null($this->itemPublicDir)) {
            $this->itemPublicDir = $this->fileStorage->getDirectoryById($this->getItemPublicHref());
        }

        return $this->itemPublicDir;
    }

    /**
     * @return \tao_models_classes_service_StorageDirectory
     * @throws \common_exception_InconsistentData
     */
    private function getItemPrivateDir()
    {
        if (is_null($this->itemPrivateDir)) {
            $this->itemPrivateDir = $this->fileStorage->getDirectoryById($this->getItemPrivateHref());
        }

        return $this->itemPrivateDir;
    }

    /**
     * @return string
     * @throws \common_exception_InconsistentData
     */
    public function getItemUri()
    {
        if (empty($this->itemHrefs)) {
            $this->loadItemHrefs();
        }

        return $this->itemHrefs[0];
    }

    /**
     * @return string
     * @throws \common_exception_InconsistentData
     */
    private function getItemPublicHref()
    {
        if (empty($this->itemHrefs)) {
            $this->loadItemHrefs();
        }

        return $this->itemHrefs[1];
    }

    /**
     * @return string
     * @throws \common_exception_InconsistentData
     */
    private function getItemPrivateHref()
    {
        if (empty($this->itemHrefs)) {
            $this->loadItemHrefs();
        }

        return $this->itemHrefs[2];
    }

    private function loadItemHrefs()
    {
        $runtimeService = $this->getServiceLocator()->get(RuntimeService::SERVICE_ID);
        /** @var \oat\taoDelivery\model\container\delivery\AbstractContainer $deliveryContainer */
        $deliveryContainer = $runtimeService->getDeliveryContainer($this->delivery->getUri());

        $deliveryPrivateDir = null;
        if ($deliveryContainer instanceof QtiTestDeliveryContainer) {
            // in case of new test runner
            $deliveryPrivateDir = $deliveryContainer->getRuntimeParams()['private'];
        } else {
            // in case of old test runner
            $inParams = $deliveryContainer->getRuntimeParams()['in'];

            foreach ($inParams as $param) {
                if ($param['def'] == \taoQtiTest_models_classes_QtiTestService::INSTANCE_FORMAL_PARAM_TEST_COMPILATION) {
                    $deliveryPrivateDir = explode('|', $param['const'])[0];
                    break;
                }
            }
        }

        if (!$deliveryPrivateDir){
            throw new \common_exception_InconsistentData('Could not determine private dir of delivery');
        }

        $deliveryPrivateStorageDir = $this->fileStorage->getDirectoryById($deliveryPrivateDir);

        $itemHrefIndexPath = \taoQtiTest_models_classes_QtiTestCompiler::buildHrefIndexPath($this->itemDefinition);

        $itemHrefs = explode('|', $deliveryPrivateStorageDir->getFile($itemHrefIndexPath)->read());

        if (count($itemHrefs) < 3) {
            throw new \common_exception_InconsistentData('The itemRef is not formatted correctly');
        }

        $this->itemHrefs = $itemHrefs;
    }
}
