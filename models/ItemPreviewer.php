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
 * Copyright (c) 2018-2020 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoQtiTestPreviewer\models;

use common_Exception as CommonException;
use common_exception_Error as ErrorException;
use common_exception_InconsistentData as InconsistentDataException;
use common_exception_NotFound as NotFoundException;
use core_kernel_classes_Resource as Resource;
use LogicException;
use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\service\ConfigurableService;
use oat\taoDelivery\model\container\delivery\AbstractContainer;
use oat\taoDelivery\model\RuntimeService;
use oat\taoItems\model\pack\ItemPack;
use oat\taoItems\model\pack\Packer;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiItem\model\qti\Service;
use oat\taoQtiItem\model\QtiJsonItemCompiler;
use oat\taoQtiTest\models\container\QtiTestDeliveryContainer;
use qtism\common\datatypes\files\FileManagerException;
use qtism\data\storage\StorageException;
use qtism\data\storage\xml\XmlDocument;
use \RuntimeException;
use tao_models_classes_service_FileStorage as FileStorage;
use tao_models_classes_service_StorageDirectory as StorageDirectory;
use taoQtiCommon_helpers_PciVariableFiller as PciVariableFiller;
use taoQtiTest_models_classes_QtiTestCompiler as QtiTestCompiler;
use taoQtiTest_models_classes_QtiTestService as QtiTestService;

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
     * @var Resource
     */
    private $delivery;

    /**
     * @var string
     */
    private $itemUri;

    /**
     * @var StorageDirectory
     */
    private $itemPublicDir;

    /**
     * @var StorageDirectory
     */
    private $itemPrivateDir;

    /**
     * @var array
     */
    private $itemHrefs = [];

    /**
     * @return FileStorage
     */
    private function getFileStorage()
    {
        return $this->getServiceLocator()->get(FileStorage::SERVICE_ID);
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
     * @param Resource $delivery
     * @return ItemPreviewer
     * @throws NotFoundException
     */
    public function setDelivery($delivery)
    {
        if (!$delivery->exists()) {
            throw new NotFoundException('Delivery "' . $delivery->getUri() . '" not found');
        }

        $this->delivery = $delivery;

        return $this;
    }

    /**
     * @throws LogicException
     */
    private function validateProperties()
    {
        if (
            empty($this->userLanguage)
            || empty($this->itemDefinition)
            || empty($this->delivery)
        ) {
            throw new LogicException(
                'UserLanguage, ItemDefinition and Delivery are mandatory for loading of compiled item data.'
            );
        }
    }

    /**
     * @return array
     *
     * @throws CommonException
     * @throws ErrorException
     * @throws InconsistentDataException
     * @throws NotFoundException
     */
    public function loadCompiledItemData()
    {
        $this->validateProperties();

        $jsonFile = $this->getItemPrivateDir()->getFile(
            $this->userLanguage . DIRECTORY_SEPARATOR . QtiJsonItemCompiler::ITEM_FILE_NAME
        );
        $xmlFile = $this->getItemPrivateDir()->getFile(
            $this->userLanguage . DIRECTORY_SEPARATOR . Service::QTI_ITEM_FILE
        );

        if ($jsonFile->exists()) {
            // new test runner is used
            $itemData = json_decode($jsonFile->read(), true);
        } elseif ($xmlFile->exists()) {
            // old test runner is used
            /** @var Packer $packer */
            $packer = (new Packer(new Resource($this->getItemUri()), $this->userLanguage))
                ->setServiceLocator($this->getServiceLocator());

            /** @var ItemPack $itemPack */
            $itemPack = $packer->pack();

            $itemData = $itemPack->JsonSerialize();
        } else {
            throw new NotFoundException('Either item.json or qti.xml should exist');
        }

        return $itemData;
    }

    /**
     * @return mixed
     * @throws InconsistentDataException
     * @throws NotFoundException
     */
    public function loadCompiledItemVariables()
    {
        $this->validateProperties();

        $variableElements = $this->getItemPrivateDir()->getFile(
            $this->userLanguage . DIRECTORY_SEPARATOR . QtiJsonItemCompiler::VAR_ELT_FILE_NAME
        );

        if (!$variableElements->exists()) {
            throw new NotFoundException('File variableElements.json should exist');
        }

        return json_decode($variableElements->read(), true);
    }

    /**
     * @return string
     * @throws CommonException
     * @throws InconsistentDataException
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
     * @throws CommonException
     */
    public function processResponses($itemUri, $jsonPayload)
    {
        if (empty($itemUri)) {
            throw new CommonException('Missing required itemUri');
        }

        $item = $this->getResource($itemUri);
        $qtiXmlDoc = $this->getQtiXmlDoc($item);
        $filler = $this->getVariableFiller($qtiXmlDoc);
        $qtiSmService = $this->getQtiSmService();
        $variables = $qtiSmService->getQtiSmVariables($filler, $jsonPayload);
        $itemSession = $this->getItemSessionService()->getItemSession($qtiXmlDoc, $variables);
        $itemSessionResult = $this->getOutcomeResponseService()->buildOutcomeResponse($itemSession);

        // Return the item session state to the client-side.
        return [
            'success' => true,
            'displayFeedback' => true,
            'itemSession' => $itemSessionResult,
        ];
    }

    /**
     * @return ItemSessionService
     */
    private function getItemSessionService()
    {
        return $this->getServiceLocator()->get(ItemSessionService::class);
    }

    /**
     * @param XmlDocument $qtiXmlDoc
     * @return PciVariableFiller
     */
    private function getVariableFiller($qtiXmlDoc)
    {
        $docComponent = $qtiXmlDoc->getDocumentComponent();
        return new PciVariableFiller($docComponent);
    }

    /**
     * @return QtiSmService
     */
    private function getQtiSmService()
    {
        return $this->getServiceLocator()->get(QtiSmService::class);
    }

    /**
     * @return OutcomeResponseService
     */
    private function getOutcomeResponseService()
    {
        return $this->getServiceLocator()->get(OutcomeResponseService::class);
    }

    /**
     * @param Resource $item
     * @return XmlDocument
     * @throws CommonException
     */
    private function getQtiXmlDoc($item)
    {
        try {
            $qtiXmlFileContent = QtiFile::getQtiFileContent($item);
            $qtiXmlDoc = new XmlDocument();
            $qtiXmlDoc->loadFromString($qtiXmlFileContent);
        } catch (StorageException $e) {
            $this->logError(($e->getPrevious() !== null) ? $e->getPrevious()->getMessage() : $e->getMessage());
            throw new RuntimeException('An error occurred while loading QTI-XML file', 0, $e);
        }

        return $qtiXmlDoc;
    }

    /**
     * @return StorageDirectory
     * @throws InconsistentDataException
     */
    private function getItemPublicDir()
    {
        if ($this->itemPublicDir === null) {
            $this->itemPublicDir = $this->getFileStorage()->getDirectoryById($this->getItemPublicHref());
        }

        return $this->itemPublicDir;
    }

    /**
     * @return StorageDirectory
     * @throws InconsistentDataException
     */
    private function getItemPrivateDir()
    {
        if ($this->itemPrivateDir === null) {
            $this->itemPrivateDir = $this->getFileStorage()->getDirectoryById($this->getItemPrivateHref());
        }

        return $this->itemPrivateDir;
    }

    /**
     * @return string
     * @throws InconsistentDataException
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
     * @throws InconsistentDataException
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
     * @throws InconsistentDataException
     */
    private function getItemPrivateHref()
    {
        if (empty($this->itemHrefs)) {
            $this->loadItemHrefs();
        }

        return $this->itemHrefs[2];
    }

    /**
     * @throws InconsistentDataException
     */
    private function loadItemHrefs()
    {
        $runtimeService = $this->getServiceLocator()->get(RuntimeService::SERVICE_ID);
        /** @var AbstractContainer $deliveryContainer */
        $deliveryContainer = $runtimeService->getDeliveryContainer($this->delivery->getUri());

        $deliveryPrivateDir = null;
        if ($deliveryContainer instanceof QtiTestDeliveryContainer) {
            // in case of new test runner
            $deliveryPrivateDir = $deliveryContainer->getRuntimeParams()['private'];
        } else {
            // in case of old test runner
            $inParams = $deliveryContainer->getRuntimeParams()['in'];

            foreach ($inParams as $param) {
                if ($param['def'] === QtiTestService::INSTANCE_FORMAL_PARAM_TEST_COMPILATION) {
                    $deliveryPrivateDir = explode('|', $param['const'])[0];
                    break;
                }
            }
        }

        if (!$deliveryPrivateDir) {
            throw new InconsistentDataException('Could not determine private dir of delivery');
        }

        $deliveryPrivateStorageDir = $this->getFileStorage()->getDirectoryById($deliveryPrivateDir);

        $itemHrefIndexPath = QtiTestCompiler::buildHrefIndexPath($this->itemDefinition);

        $itemHrefs = explode('|', $deliveryPrivateStorageDir->getFile($itemHrefIndexPath)->read());

        if (count($itemHrefs) < 3) {
            throw new InconsistentDataException('The itemRef is not formatted correctly');
        }

        $this->itemHrefs = $itemHrefs;
    }
}
