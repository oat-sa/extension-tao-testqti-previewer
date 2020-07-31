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

use common_exception_Error;
use oat\tao\helpers\Base64;
use common_Exception as CommonException;
use common_exception_BadRequest as BadRequestException;
use common_exception_MissingParameter as MissingParameterException;
use common_exception_NoImplementation as NoImplementationException;
use common_exception_NotImplemented as NotImplementedException;
use common_exception_Unauthorized as UnauthorizedException;
use common_exception_UserReadableException as UserReadableException;
use Exception;
use oat\generis\model\OntologyAwareTrait;
use oat\tao\model\media\sourceStrategy\HttpSource;
use oat\tao\model\routing\AnnotationReader\security;
use oat\taoItems\model\media\ItemMediaResolver;
use oat\taoQtiTestPreviewer\models\ItemPreviewer;
use oat\taoQtiTestPreviewer\models\PreviewLanguageService;
use tao_actions_ServiceModule as ServiceModule;
use tao_helpers_Http as HttpHelper;
use tao_models_classes_FileNotFoundException as FileNotFoundException;
use taoItems_models_classes_ItemsService;
use taoQtiTest_helpers_TestRunnerUtils as TestRunnerUtils;
use oat\taoItems\model\pack\Packer;

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
     * Gets an error response array
     * @param Exception $e
     * @return array
     */
    protected function getErrorResponse($e)
    {
        $response = [
            'success' => false,
            'type' => 'error',
        ];

        if ($e instanceof FileNotFoundException) {
            $response['type'] = 'FileNotFound';
            $response['message'] = __('File not found');
        } elseif ($e instanceof UnauthorizedException) {
            $response['code'] = 403;
            $response['message'] = $e->getUserMessage();
        } elseif ($e instanceof UserReadableException) {
            $response['message'] = $e->getUserMessage();
        } elseif ($e instanceof Exception) {
            $response['type'] = 'exception';
            $response['code'] = $e->getCode();
            $response['message'] = $e->getMessage();
        } else {
            $response['message'] = __('An error occurred!');
        }

        return $response;
    }

    /**
     * Gets an HTTP response code
     * @param Exception $e
     * @return int
     */
    protected function getErrorCode($e)
    {
        switch (true) {
            case $e instanceof NotImplementedException:
            case $e instanceof NoImplementationException:
            case $e instanceof UnauthorizedException:
                $code = 403;
                break;

            case $e instanceof FileNotFoundException:
                $code = 404;
                break;

            default:
                $code = 500;
                break;
        }

        return $code;
    }

    /**
     * Initializes the delivery session
     */
    public function init()
    {
        $code = 200;

        try {
            $this->validateCsrf();

            $requestParams = $this->getPsrRequest()->getQueryParams();
            $serviceCallId = $requestParams['serviceCallId'];

            $response = [
                'success' => $serviceCallId === 'previewer',
                'itemIdentifier' => null,
                'itemData' => null
            ];
        } catch (Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * Provides the definition data and the state for a particular item
     *
     * @param taoItems_models_classes_ItemsService $itemsService
     *
     * @return void
     */
    public function getItem(taoItems_models_classes_ItemsService $itemsService)
    {
        $code = 200;

        try {
            $this->validateCsrf();

            $requestParams = $this->getPsrRequest()->getQueryParams();

            $itemUri = $requestParams['itemUri'] ?? '';
            $resultId = $requestParams['resultId'] ?? '';

            $response = [
                'baseUrl' => '',
                'content' => [],
            ];

            // Previewing a result.
            if ($resultId !== '') {
                if (!isset($requestParams['itemDefinition'])) {
                    throw new MissingParameterException('itemDefinition', $this->getRequestURI());
                }

                if (!isset($requestParams['deliveryUri'])) {
                    throw new MissingParameterException('deliveryUri', $this->getRequestURI());
                }

                $itemDefinition = $requestParams['itemDefinition'];
                $delivery = $this->getResource($requestParams['deliveryUri']);

                /** @var ItemPreviewer $itemPreviewer */
                $itemPreviewer = $this->getServiceLocator()->get(ItemPreviewer::class);
                $itemPreviewer->setServiceLocator($this->getServiceLocator());

                /** @var PreviewLanguageService $previewLanguageService */
                $previewLanguageService = $this->getServiceLocator()->get(PreviewLanguageService::class);
                $previewLanguage = $previewLanguageService->getPreviewLanguage($delivery->getUri(), $resultId);

                $response['content'] = $itemPreviewer
                    ->setItemDefinition($itemDefinition)
                    ->setUserLanguage($previewLanguage)
                    ->setDelivery($delivery)
                    ->loadCompiledItemData();

                $response['baseUrl'] = $itemPreviewer->getBaseUrl();
            } elseif ($itemUri) {
                $item = $this->getResource($itemUri);
                $lang = $this->getSession()->getDataLanguage();

                if (!$itemsService->hasItemContent($item, $lang)) {
                    return $this->returnJson($response, $code);
                }

                $packer = new Packer($item, $lang);
                $packer->setServiceLocator($this->getServiceLocator());

                $itemPack = $packer->pack();
                $response['content'] = $itemPack->JsonSerialize();
                $response['baseUrl'] = _url('asset', null, null, ['uri' => $itemUri, 'path' => '']);
            } else {
                throw new BadRequestException('Either itemUri or resultId needs to be provided.');
            }

            $response['success'] = true;
        } catch (Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * Gets access to an asset
     *
     * @throws CommonException
     * @throws FileNotFoundException
     * @throws common_exception_Error
     */
    public function asset()
    {
        $requestParams = $this->getPsrRequest()->getQueryParams();
        $itemUri = $requestParams['uri'];
        $path = $requestParams['path'];

        $item = $this->getResource($itemUri);
        $lang = $this->getSession()->getDataLanguage();
        $resolver = new ItemMediaResolver($item, $lang);

        $asset = $resolver->resolve($path);
        $mediaSource = $asset->getMediaSource();
        $mediaIdentifier = $asset->getMediaIdentifier();

        if ($mediaSource instanceof HttpSource || Base64::isEncodedImage($mediaIdentifier)) {
            throw new CommonException('Only tao files available for rendering through item preview');
        }

        $info = $mediaSource->getFileInfo($mediaIdentifier);
        $stream = $mediaSource->getFileStream($mediaIdentifier);
        HttpHelper::returnStream($stream, $info['mime']);
    }

    /**
     * Stores the state object and the response set of a particular item
     */
    public function submitItem()
    {
        $code = 200;

        try {
            $this->validateCsrf();
            $requestParams = $this->getPsrRequest()->getQueryParams();
            $itemUri = $requestParams['itemUri'];
            $jsonPayload = $this->getPayload();
            $response = $this->getItemPreviewer()->processResponses($itemUri, $jsonPayload);
        } catch (Exception $e) {
            $response = $this->getErrorResponse($e);
            $code = $this->getErrorCode($e);
        }

        $this->returnJson($response, $code);
    }

    /**
     * @return ItemPreviewer
     */
    private function getItemPreviewer()
    {
        return $this->getServiceLocator()->get(ItemPreviewer::class);
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
}
