<?php

/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2018-2026 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\controller;

use Exception;
use common_exception_Error;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Psr7\Request;
use JsonException;
use oat\tao\helpers\Base64;
use oat\tao\model\http\HttpJsonResponseTrait;
use RuntimeException;
use tao_helpers_Http as HttpHelper;
use oat\taoItems\model\pack\Packer;
use common_Exception as CommonException;
use taoItems_models_classes_ItemsService;
use oat\generis\model\OntologyAwareTrait;
use oat\qtiItemPci\controller\PciLoader;
use tao_actions_ServiceModule as ServiceModule;
use oat\taoItems\model\media\ItemMediaResolver;
use oat\taoQtiTestPreviewer\models\ItemPreviewer;
use oat\tao\model\media\sourceStrategy\HttpSource;
use oat\tao\model\routing\AnnotationReader\security;
use common_exception_BadRequest as BadRequestException;
use taoQtiTest_helpers_TestRunnerUtils as TestRunnerUtils;
use oat\taoQtiTestPreviewer\models\FigureService;
use oat\taoQtiTestPreviewer\models\NamespaceService;
use oat\taoQtiTestPreviewer\models\PassageStylesService;
use oat\taoQtiTestPreviewer\models\PreviewLanguageService;
use oat\taoMediaManager\model\sharedStimulus\css\service\ListStylesheetsService;
use common_exception_Unauthorized as UnauthorizedException;
use common_exception_NotImplemented as NotImplementedException;
use common_exception_MissingParameter as MissingParameterException;
use common_exception_NoImplementation as NoImplementationException;
use common_exception_UserReadableException as UserReadableException;
use tao_models_classes_FileNotFoundException as FileNotFoundException;

/**
 * Class Previewer
 *
 * @package oat\taoQtiTestPreviewer\controller
 */
class Previewer extends ServiceModule
{
    use OntologyAwareTrait;
    use HttpJsonResponseTrait;

    /**
     * Previewer constructor.
     *
     * @security("hide")
     */
    public function __construct()
    {
        parent::__construct();

        // Prevent anything to be cached by the client.
        TestRunnerUtils::noHttpClientCache();
    }

    /**
     * Initializes the delivery session
     */
    public function init(): void
    {
        $code = 200;

        try {
            $requestParams = $this->getPsrRequest()->getQueryParams();
            $serviceCallId = $requestParams['serviceCallId'];

            $response = [
                'success' => $serviceCallId === 'previewer',
                'itemIdentifier' => null,
                'itemData' => null,
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
     */
    public function getItem(taoItems_models_classes_ItemsService $itemsService): void
    {
        $code = 200;

        try {
            $requestParams = $this->getPsrRequest()->getQueryParams();

            $itemUri = $requestParams['itemUri'] ?? '';
            $resultId = $requestParams['resultId'] ?? '';
            $pcis = $requestParams['pcis'] ?? false;
            $itemData = $requestParams['itemData'] ?? false;

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
                    $this->returnJson($response, $code);
                    return;
                }

                $packer = new Packer($item, $lang, true);
                $packer->setServiceLocator($this->getServiceLocator());

                $itemPack = $packer->pack();
                $response['content'] = $itemPack->JsonSerialize();
                $response['baseUrl'] = _url('asset', null, null, [
                    'uri' => $itemUri,
                    'path' => '',
                ]);
            } else {
                throw new BadRequestException('Either itemUri or resultId needs to be provided.');
            }

            // query params which can be used to modify the response structure:
            if ($itemData) {
                $response['content'] = FigureService::checkFigureInItemData($response['content']);
                $response['content'] = NamespaceService::removeNamespacesInItemData($response['content']);
                $response['content'] = PassageStylesService::checkAndInjectStylesInItemData(
                    $response['content'],
                    $this->getServiceLocator()->get(ListStylesheetsService::class)
                );
                $response['itemIdentifier'] ??= $response['content']['data']['identifier'] ?? null;
                $response['itemData'] = $response['content'];
                $response['content'] = null;
            }
            if ($pcis) {
                $response['portableElements'] = [
                    'pci' => $this->getPcis()
                ];
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
    public function asset(): void
    {
        $requestParams = $this->getPsrRequest()->getQueryParams();

        $item = $this->getResource($requestParams['uri']);
        $lang = $this->getSession()->getDataLanguage();
        $resolver = new ItemMediaResolver($item, $lang);

        $asset = $resolver->resolve($requestParams['path']);
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
    public function submitItem(): void
    {
        $code = 200;

        try {
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

    public function getTokens(): void
    {
        // TODO encapsulate the implementation in tao-core; the endpoint itself may be moved there too
        $authUri = getEnv('ENV_AUTH_URI');
        $clientId = getEnv('ENV_CLIENT_ID');
        $clientSecret = getEnv('ENV_CLIENT_SECRET');

        if (!$authUri || !$clientId || !$clientSecret) {
            $this->setErrorJsonResponse('OAuth2 credentials not found.', errorCode: 404);
            return;
        }

        $client = new Client();
        $request = new Request('POST', "$authUri?with-refresh-token=true", [], json_encode([
            'grant_type' => 'client_credentials',
            'client_id' => $clientId,
            'client_secret' => $clientSecret
        ]));
        $request = $request->withAddedHeader('Content-Type', 'application/json');

        try {
            $response = $client->send($request);
        } catch (GuzzleException $exception) {
            $this->setErrorJsonResponse(
                "Failed to fetch Auth tokens. {$exception->getMessage()}",
                $exception->getCode(),
                statusCode: 424
            );
            return;
        }

        $statusCode = $response->getStatusCode();
        $content = $response->getBody()->getContents();
        $content = json_decode($content, true);

        if ($statusCode !== 200 || !isset($content['access_token'])) {
            $this->setErrorJsonResponse('Failed to fetch Auth tokens.', $statusCode, statusCode: 424);
            return;
        }

        $this->setSuccessJsonResponse($content);
    }

    public function configuration(): void
    {
        // TODO encapsulate the configuration fetcher in tao-core
        //  !IMPORTANT! the endpoint must remain here
        @[$_, $payload, $_] = explode('.', $_SERVER['HTTP_AUTHORIZATION' ?? '']);
        $rawToken = base64_decode($payload ?? '');
        $token = json_decode($rawToken, true);
        if (empty($token['tenant_id'])) {
            $this->setErrorJsonResponse('Unauthorized', errorCode: 401);
            return;
        }

        $uri = getenv('ENV_CONFIG_URI');
        if (!$uri) {
            $this->setErrorJsonResponse('Configuration not found.', errorCode: 404);
            return;
        }
        $client = new Client();
        $request = new Request(
            'GET',
            "$uri/api/v1/tenants/{$token['tenant_id']}/configurations/testRunnerConfiguration"
        );
        try {
            $response = json_decode(
                $client->send($request)->getBody()->getContents(),
                true,
                flags: JSON_THROW_ON_ERROR
            );
            if (empty($response['value']['providers']) || empty($response['value']['options'])) {
                throw new RuntimeException('Previewer configuration missing.');
            }
        } catch (GuzzleException | JsonException | RuntimeException $exception) {
            $this->setErrorJsonResponse(
                "Failed to fetch Previewer configuration. {$exception->getMessage()}",
                $exception->getCode(),
                statusCode: 424
            );
            return;
        }

        try {
            $runnerProviders = $response['value']['providers'];
            $previewProviders = $response['value']['previewProviders'] ?? [];
            $providers = [];
            foreach (['runner', 'itemRunner', 'plugins'] as $key) {
                $providers[$key] = $previewProviders[$key] ?? $runnerProviders[$key];
            }
            if (isset($previewProviders['proxy'])) {
                $providers['proxy'] = $previewProviders['proxy'];
            }
            $response = [
                'providers' => $providers,
                'options' => $response['value']['options']
            ];
        } catch (Exception $e) {
            $response = $this->getErrorResponse($e);
            $this->setErrorJsonResponse($e->getMessage(), $e->getCode(), statusCode: $this->getErrorCode($e));
            return;
        }

        $this->setSuccessJsonResponse($response);
    }

    /**
     * Gets an error response array
     *
     * @param Exception $e
     *
     * @return array
     */
    protected function getErrorResponse(Exception $e): array
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
     *
     * @param Exception $e
     *
     * @return int
     */
    protected function getErrorCode(Exception $e): int
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
     * @return ItemPreviewer
     */
    private function getItemPreviewer(): ItemPreviewer
    {
        /** @var ItemPreviewer $itemPreviewer */
        $itemPreviewer = $this->getServiceLocator()->get(ItemPreviewer::class);

        return $itemPreviewer;
    }

    /**
     * Gets payload from the request
     *
     * @return array|mixed|object|null
     */
    private function getPayload()
    {
        $jsonPayload = $this->getPsrRequest()->getParsedBody();

        return json_decode($jsonPayload['itemResponse'], true);
    }

    private function getPcis(): array
    {
        $pcis = (new PciLoader())->getLatestPciRuntimes();
        return $this->createIMSPCIs($pcis);
    }

    /**
     * Create portableElements.pci section with IMS PCI only for itemData object
     * Set absolute path in runtime.hook
     * Implementation from @see https://github.com/oat-sa/extension-tao-test-preview-ui-loader/blob/master/views/js/previewer/helpers/getIMSPCIs.js
     * @param array $pci - a parsed URL
     * @return array $imsPCI
     */
    private function createIMSPCIs($pci): array
    {
        $imsPCI = [];
        foreach ($pci as $key => $value) {
            $pciData = $value[0];
            if ($pciData['model'] === 'IMSPCI') {
                // if no runtime.hook then module path should be used
                if (!$pciData['runtime']['hook']) {
                    foreach ($pciData['runtime']['modules'] ?? [] as $paths) {
                        if (is_string($paths)) {
                            $pciData['runtime']['hook'] = $paths;
                        } elseif (is_array($paths) && count($paths)) {
                            $pciData['runtime']['hook'] = $paths[0];
                        }
                    }
                }
                // runtime.hook should be absolute path for newUI test runner

                $url = $this->parseUrlParts($pciData['runtime']['hook']);

                if (is_string($pciData['baseUrl']) && empty($url['scheme'])) {
                    $pciData['runtime']['hook'] =
                        $this->prependToUrl($url, $pciData['baseUrl'], $pciData['slashcat'] ?? false);
                    $imsPCI[$key] = [$pciData];
                }
            }
        }
        return $imsPCI;
    }

    /**
     * Parse a URL/path string into directory and file components
     * Implementation loosely based on @see https://github.com/oat-sa/tao-core-sdk-fe/blob/master/src/util/url.js
     * @param string $url - the URL to parse
     * @return array
     */
    private function parseUrlParts(string $url): array
    {
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? $url;

        $lastSlash = strrpos($path, '/');
        if ($lastSlash !== false) {
            $directory = substr($path, 0, $lastSlash + 1);
            $file = substr($path, $lastSlash + 1);
        } else {
            $directory = '';
            $file = $path;
        }

        return [
            'directory' => $directory,
            'file' => $file,
            'scheme' => $parsed['scheme'] ?? null,
        ];
    }

    /**
     * Prepend a base to an URL
     * Implementation based on @see https://github.com/oat-sa/extension-tao-test-preview-ui-loader/blob/master/views/js/previewer/helpers/getIMSPCIs.js
     * @param array $url - a parsed URL with 'directory' and 'file' keys
     * @param string $base - the base to prepend
     * @param bool $slashcat - remove dots, double slashes, etc.
     * @return string the URL
     */
    private function prependToUrl(array $url, string $base, ?bool $slashcat): string
    {
        $slashcat = $slashcat ?? false;

        if ($slashcat === true) {
            // Remove leading ./ OR / from both directory and filename
            $directory = preg_replace('#^\./#', '', $url['directory']);
            $directory = ltrim($directory, '/');
            $file = preg_replace('#^\./#', '', $url['file']);
            $file = ltrim($file, '/');
            return rtrim($base, '/') . '/' . $directory . urlencode($file);
        }

        // When slashcat is disabled, more permissive cleaning:
        // Remove leading ./ or / both directory and filename
        $directory = preg_replace('#^\.?/#', '', $url['directory']);
        $file = preg_replace('#^\.?/#', '', $url['file']);
        return $base . $directory . urlencode($file);
    }
}
