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
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoQtiTestPreviewer\controller;

use common_Exception;
use common_Logger;
use oat\generis\model\OntologyAwareTrait;
use oat\tao\model\media\sourceStrategy\HttpSource;
use oat\tao\model\routing\AnnotationReader\security;
use oat\taoItems\model\media\ItemMediaResolver;
use oat\taoQtiItem\helpers\QtiFile;
use oat\taoQtiTestPreviewer\models\ItemPreviewer;
use oat\taoResultServer\models\classes\ResultServerService;
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
use tao_actions_ServiceModule as ServiceModule;
use taoQtiCommon_helpers_PciStateOutput;
use taoQtiCommon_helpers_PciVariableFiller;
use taoQtiCommon_helpers_ResultTransmissionException;
use taoQtiCommon_helpers_Utils;
use taoQtiTest_helpers_TestRunnerUtils as TestRunnerUtils;
use oat\taoItems\model\pack\ItemPack;
use oat\taoItems\model\pack\Packer;
use oat\generis\model\GenerisRdf;

/**
 * Class taoQtiTest_actions_Runner
 *
 * Serves QTI implementation of the test runner
 */
class Previewer extends ServiceModule
{
    use OntologyAwareTrait;
    
    /**
     * taoQtiTest_actions_Runner constructor.
     * @security("hide")
     */
    public function __construct()
    {
        // Prevent anything to be cached by the client.
        TestRunnerUtils::noHttpClientCache();
    }

    /**
     * Gets an error response object
     * @param Exception [$e] Optional exception from which extract the error context
     * @param array $prevResponse Response before catch
     * @return array
     */
    protected function getErrorResponse($e = null)
    {
        $response = [
            'success' => false,
            'type' => 'error',
        ];

        if ($e) {
            if ($e instanceof \Exception) {
                $response['type'] = 'exception';
                $response['code'] = $e->getCode();
            }

            if ($e instanceof \common_exception_UserReadableException) {
                $response['message'] = $e->getUserMessage();
            } else {
                $response['message'] = __('An error occurred!');
            }

            switch (true) {
                case $e instanceof \tao_models_classes_FileNotFoundException:
                    $response['type'] = 'FileNotFound';
                    $response['message'] = __('File not found');
                    break;

                case $e instanceof \common_exception_Unauthorized:
                    $response['code'] = 403;
                    break;
            }
        }

        return $response;
    }

    /**
     * Gets an HTTP response code
     * @param Exception [$e] Optional exception from which extract the error context
     * @return int
     */
    protected function getErrorCode($e = null)
    {
        $code = 200;
        if ($e) {
            $code = 500;

            switch (true) {
                case $e instanceof \common_exception_NotImplemented:
                case $e instanceof \common_exception_NoImplementation:
                case $e instanceof \common_exception_Unauthorized:
                    $code = 403;
                    break;

                case $e instanceof \tao_models_classes_FileNotFoundException:
                    $code = 404;
                    break;
            }
        }
        return $code;
    }

    /**
     * @param string $resultId
     * @param string $deliveryUri
     * @return string
     * @throws \common_exception_Error
     */
    protected function getUserLanguage($resultId, $deliveryUri)
    {
        /** @var ResultServerService $resultServerService */
        $resultServerService = $this->getServiceLocator()->get(ResultServerService::SERVICE_ID);
        /** @var \taoResultServer_models_classes_ReadableResultStorage $implementation */
        $implementation = $resultServerService->getResultStorage($deliveryUri);

        $testTaker = new \core_kernel_users_GenerisUser($this->getResource($implementation->getTestTaker($resultId)));
        $lang = $testTaker->getPropertyValues(GenerisRdf::PROPERTY_USER_DEFLG);

        return empty($lang) ? DEFAULT_LANG : (string) current($lang);
    }

    /**
     * Initializes the delivery session
     */
    public function init()
    {
        $code = 200;

        try {
            $this->validateCsrf();

            $serviceCallId = $this->getRequestParameter('serviceCallId');

            $response = [
                'success' => $serviceCallId == 'previewer',
                'itemIdentifier' => null,
                'itemData' => null
            ];

        } catch (\Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * Provides the definition data and the state for a particular item
     */
    public function getItem()
    {
        $code = 200;

        try {
            $this->validateCsrf();

            $itemUri = $this->getRequestParameter('itemUri');
            $resultId = $this->getRequestParameter('resultId');

            $response = [
                'baseUrl' => '',
                'content' => [],
            ];

            // previewing a result
            if ($resultId) {
                if (!$this->hasRequestParameter('itemDefinition')) {
                    throw new \common_exception_MissingParameter('itemDefinition', $this->getRequestURI());
                }

                if (!$this->hasRequestParameter('deliveryUri')) {
                    throw new \common_exception_MissingParameter('deliveryUri', $this->getRequestURI());
                }

                $itemDefinition = $this->getRequestParameter('itemDefinition');
                $delivery = $this->getResource($this->getRequestParameter('deliveryUri'));

                $itemPreviewer = new ItemPreviewer();
                $itemPreviewer->setServiceLocator($this->getServiceLocator());

                $response['content'] = $itemPreviewer->setItemDefinition($itemDefinition)
                    ->setUserLanguage($this->getUserLanguage($resultId, $delivery->getUri()))
                    ->setDelivery($delivery)
                    ->loadCompiledItemData();

                $response['baseUrl'] = $itemPreviewer->getBaseUrl();

            } else if ($itemUri) {
                $item = $this->getResource($itemUri);
                $lang = $this->getSession()->getDataLanguage();
                $packer = new Packer($item, $lang);
                $packer->setServiceLocator($this->getServiceLocator());

                /** @var ItemPack $itemPack */
                $itemPack = $packer->pack();
                $response['content'] = $itemPack->JsonSerialize();
                $response['baseUrl'] = _url('asset', null, null, ['uri' => $itemUri, 'path' => '/']);

            } else {
                throw new \common_exception_BadRequest('Either itemUri or resultId needs to be provided.');
            }

            $response['success'] = true;
        } catch (\Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * Gets access to an asset
     * @throws \common_exception_Error
     * @throws \tao_models_classes_FileNotFoundException
     * @throws common_Exception
     */
    public function asset()
    {
        $itemUri = $this->getRequestParameter('uri');
        $path = rawurldecode($this->getRequestParameter('path'));
        
        $item = $this->getResource($itemUri);
        $lang = $this->getSession()->getDataLanguage();
        $resolver = new ItemMediaResolver($item, $lang);
        
        $asset = $resolver->resolve($path);
        if ($asset->getMediaSource() instanceof HttpSource) {
            throw new common_Exception('Only tao files available for rendering through item preview');
        }
        $info = $asset->getMediaSource()->getFileInfo($asset->getMediaIdentifier());
        $stream = $asset->getMediaSource()->getFileStream($asset->getMediaIdentifier());
        \tao_helpers_Http::returnStream($stream, $info['mime']);
    }

    /**
     * Stores the state object and the response set of a particular item
     */
    public function submitItem()
    {
        $code = 200;

        try {
            $this->validateCsrf();

            $itemUri = $this->getPsrRequest()->getQueryParams('itemUri');

            $response = $this->processResponses($itemUri);

        } catch (\Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * Item's ResponseProcessing.
     * 
     * @param $itemUri
     * @throws \common_exception_Error
     * @throws \qtism\common\datatypes\files\FileManagerException
     * @throws common_Exception
     */
    protected function processResponses($itemUri){
        if (empty($itemUri)) {
            throw new common_Exception('missing required itemUri');
        }

        $item = $this->getResource($itemUri['itemUri']);
        $qtiXmlDoc = $this->getQtiXmlDoc($item);
        $itemSession = $this->getItemSession($qtiXmlDoc);
        $filler = $this->getVariableFilter($qtiXmlDoc);
        $variables = $this->getQtiSmVariables($filler);

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

    protected function buildOutcomeResponse(AssessmentItemSession $itemSession) {
        $stateOutput = new taoQtiCommon_helpers_PciStateOutput();

        foreach ($itemSession->getOutcomeVariables(false) as $var) {
            $stateOutput->addVariable($var);
        }

        $output = $stateOutput->getOutput();
        return $output;
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

    /**
     * Gets payload from the request
     * @return array|mixed|object|null
     */
    private function getPayload()
    {
        $jsonPayload = $this->getPsrRequest()->getParsedBody();
        $jsonPayload = json_decode($jsonPayload['itemResponse'], true);

        return $jsonPayload;
    }

    /**
     * Convert client-side data as QtiSm Runtime Variables
     * @param taoQtiCommon_helpers_PciVariableFiller $filler
     * @throws FileManagerException
     * @return Variable[]
     */
    private function getQtiSmVariables($filler)
    {
        $variables = array();
        $jsonPayload = $this->getPayload();

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
}
