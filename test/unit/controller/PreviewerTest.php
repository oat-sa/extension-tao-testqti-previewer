<?php

/**
 * SPDX-FileCopyrightText: 2019-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\test\unit\controller;

use common_exception_Error;
use common_Exception;
use core_kernel_classes_Resource;
use GuzzleHttp\Psr7\ServerRequest;
use GuzzleHttp\Psr7\Utils;
use oat\oatbox\service\ServiceManager;
use oat\tao\model\http\ContentDetector;
use oat\tao\model\media\MediaBrowser;
use oat\tao\model\media\MediaService;
use oat\taoQtiTestPreviewer\models\SharedStimulusPreviewRegistry;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionMethod;
use ReflectionProperty;
use RuntimeException;
use stdClass;
use taoItems_models_classes_ItemsService;

class PreviewerTest extends TestCase
{
    private const ITEM_URI = 'https://example.com/tao.rdf#i123';

    private PreviewerProxy $subject;

    private ?ServiceManager $serviceManagerBackup = null;

    private ?object $contextInstanceBackup = null;

    private array $serverBackup = [];

    private SharedStimulusPreviewRegistry $sharedStimulusPreviewRegistry;

    protected function setUp(): void
    {
        $this->serverBackup = $_SERVER;
        $_SERVER['REQUEST_METHOD'] ??= 'GET';
        $this->contextInstanceBackup = $this->setFakeContext();
        $this->serviceManagerBackup = ServiceManager::getServiceManager();
        $this->sharedStimulusPreviewRegistry = $this->createMock(SharedStimulusPreviewRegistry::class);

        $this->subject = $this->createSubject();
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->serverBackup;
        $this->setContextInstance($this->contextInstanceBackup);

        if ($this->serviceManagerBackup instanceof ServiceManager) {
            ServiceManager::setServiceManager($this->serviceManagerBackup);
        }
    }

    public function testGetItemReturnsSharedStimulusPreviewResponseWhenItemHasNoCompiledContent(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $session = $this->createSession('en-US');
        $itemsService = $this->createMock(taoItems_models_classes_ItemsService::class);

        $itemsService
            ->expects($this->once())
            ->method('hasItemContent')
            ->with($item, 'en-US')
            ->willReturn(false);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('buildResponse')
            ->willReturn([
                'baseUrl' => 'asset-url',
                'content' => [
                    'type' => 'qti',
                    'data' => [
                        'identifier' => 'i123',
                    ],
                ],
            ]);

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $session;
        $this->subject->setRequest((new ServerRequest('GET', '/'))->withQueryParams(['itemUri' => self::ITEM_URI]));

        $this->subject->getItem($itemsService);

        $this->assertCount(1, $this->subject->jsonCalls);
        $this->assertSame(200, $this->subject->jsonCalls[0]['status']);
        $this->assertTrue($this->subject->jsonCalls[0]['data']['success']);
        $this->assertSame('i123', $this->subject->jsonCalls[0]['data']['itemIdentifier']);
        $this->assertSame('i123', $this->subject->jsonCalls[0]['data']['itemData']['data']['identifier']);
        $this->assertInstanceOf(stdClass::class, $this->subject->jsonCalls[0]['data']['portableElements']);
    }

    public function testGetItemReturnsErrorResponseWhenSharedStimulusParsingFails(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $session = $this->createSession('en-US');
        $itemsService = $this->createMock(taoItems_models_classes_ItemsService::class);

        $itemsService
            ->expects($this->once())
            ->method('hasItemContent')
            ->with($item, 'en-US')
            ->willReturn(false);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('buildResponse')
            ->willThrowException(new RuntimeException('Boom'));

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $session;
        $this->subject->setRequest((new ServerRequest('GET', '/'))->withQueryParams(['itemUri' => self::ITEM_URI]));

        $this->subject->getItem($itemsService);

        $this->assertCount(1, $this->subject->jsonCalls);
        $this->assertSame(500, $this->subject->jsonCalls[0]['status']);
        $this->assertFalse($this->subject->jsonCalls[0]['data']['success']);
        $this->assertSame('exception', $this->subject->jsonCalls[0]['data']['type']);
        $this->assertSame('Boom', $this->subject->jsonCalls[0]['data']['message']);
    }

    public function testGetItemReturnsStandardPreviewResponseWhenItemHasCompiledContent(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $session = $this->createSession('en-US');
        $itemsService = $this->createMock(taoItems_models_classes_ItemsService::class);

        $itemsService
            ->expects($this->once())
            ->method('hasItemContent')
            ->with($item, 'en-US')
            ->willReturn(true);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->never())
            ->method('buildResponse');

        $this->subject->itemResponse = [
            'baseUrl' => 'asset-url',
            'content' => [
                'type' => 'qti',
                'data' => [
                    'identifier' => 'compiled-item',
                ],
            ],
        ];
        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $session;
        $this->subject->setRequest((new ServerRequest('GET', '/'))->withQueryParams(['itemUri' => self::ITEM_URI]));

        $this->subject->getItem($itemsService);

        $this->assertCount(1, $this->subject->jsonCalls);
        $this->assertSame(200, $this->subject->jsonCalls[0]['status']);
        $this->assertTrue($this->subject->jsonCalls[0]['data']['success']);
        $this->assertSame('compiled-item', $this->subject->jsonCalls[0]['data']['itemIdentifier']);
        $this->assertSame('compiled-item', $this->subject->jsonCalls[0]['data']['itemData']['data']['identifier']);
    }

    public function testGetItemReturnsErrorWhenNoSharedStimulusHandlerSupportsTheItem(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $session = $this->createSession('en-US');
        $itemsService = $this->createMock(taoItems_models_classes_ItemsService::class);

        $itemsService
            ->expects($this->once())
            ->method('hasItemContent')
            ->with($item, 'en-US')
            ->willReturn(false);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('buildResponse')
            ->willReturn(null);

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $session;
        $this->subject->setRequest((new ServerRequest('GET', '/'))->withQueryParams(['itemUri' => self::ITEM_URI]));

        $this->subject->getItem($itemsService);

        $this->assertCount(1, $this->subject->jsonCalls);
        $this->assertSame(500, $this->subject->jsonCalls[0]['status']);
        $this->assertFalse($this->subject->jsonCalls[0]['data']['success']);
        $this->assertSame('exception', $this->subject->jsonCalls[0]['data']['type']);
        $this->assertSame(
            sprintf('No shared stimulus preview handler registered for item "%s".', self::ITEM_URI),
            $this->subject->jsonCalls[0]['data']['message']
        );
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testAssetStreamsSharedStimulusStylesheet(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $subject = $this->createSubject();

        $this->setGlobalServices([
            ContentDetector::class => $this->createContentDetector(false),
        ]);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('loadAssetStream')
            ->willReturn(Utils::streamFor('css-body'));

        $subject->resources = [self::ITEM_URI => $item];
        $subject->setRequest(
            (new ServerRequest('GET', '/'))->withQueryParams([
                'uri' => self::ITEM_URI,
                'path' => 'css/tao-user-styles.css',
            ])
        );

        ob_start();
        $subject->asset();
        $result = ob_get_clean();

        $this->assertSame('css-body', $result);
    }

    /**
     * @runInSeparateProcess
     * @preserveGlobalState disabled
     */
    public function testAssetFallsBackToStandardResolutionForNonCssPath(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $subject = $this->createSubject();
        $mediaSource = $this->createMock(MediaBrowser::class);
        $mediaService = $this->createMock(MediaService::class);

        $mediaService
            ->expects($this->once())
            ->method('getMediaSource')
            ->with('mediamanager')
            ->willReturn($mediaSource);

        $mediaSource
            ->expects($this->once())
            ->method('getFileInfo')
            ->with('image.png')
            ->willReturn(['mime' => 'image/png']);

        $mediaSource
            ->expects($this->once())
            ->method('getFileStream')
            ->with('image.png')
            ->willReturn(Utils::streamFor('image-bytes'));

        $this->setGlobalServices([
            ContentDetector::class => $this->createContentDetector(false),
            MediaService::SERVICE_ID => $mediaService,
        ]);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('loadAssetStream')
            ->with($item, 'taomedia://mediamanager/image.png')
            ->willReturn(null);

        $subject->resources = [self::ITEM_URI => $item];
        $subject->session = $this->createSession('en-US');
        $subject->setRequest(
            (new ServerRequest('GET', '/'))->withQueryParams([
                'uri' => self::ITEM_URI,
                'path' => 'taomedia://mediamanager/image.png',
            ])
        );

        ob_start();
        $subject->asset();
        $result = ob_get_clean();

        $this->assertSame('image-bytes', $result);
    }

    public function testAssetRejectsUnsafeSharedStimulusPath(): void
    {
        $item = $this->mockItem(self::ITEM_URI);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('loadAssetStream')
            ->with($item, '../unsafe.css')
            ->willThrowException(new common_exception_Error('Invalid path "../unsafe.css"'));

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->setRequest(
            (new ServerRequest('GET', '/'))->withQueryParams([
                'uri' => self::ITEM_URI,
                'path' => '../unsafe.css',
            ])
        );

        $this->expectException(common_exception_Error::class);
        $this->expectExceptionMessage('Invalid path "../unsafe.css"');

        $this->subject->asset();
    }

    public function testAssetRejectsHttpAssetsOnStandardPath(): void
    {
        $item = $this->mockItem(self::ITEM_URI);

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('loadAssetStream')
            ->with($item, 'https://example.com/image.png')
            ->willReturn(null);

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $this->createSession('en-US');
        $this->subject->setRequest(
            (new ServerRequest('GET', '/'))->withQueryParams([
                'uri' => self::ITEM_URI,
                'path' => 'https://example.com/image.png',
            ])
        );

        $this->expectException(common_Exception::class);
        $this->expectExceptionMessage('Only tao files available for rendering through item preview');

        $this->subject->asset();
    }

    public function testAssetRejectsBase64ImagesOnStandardPath(): void
    {
        $item = $this->mockItem(self::ITEM_URI);
        $base64Image =
            'data:image/png;base64,'
            . 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wnpa9sAAAAASUVORK5CYII=';

        $this->sharedStimulusPreviewRegistry
            ->expects($this->once())
            ->method('loadAssetStream')
            ->with($item, $base64Image)
            ->willReturn(null);

        $this->subject->resources = [self::ITEM_URI => $item];
        $this->subject->session = $this->createSession('en-US');
        $this->subject->setRequest(
            (new ServerRequest('GET', '/'))->withQueryParams([
                'uri' => self::ITEM_URI,
                'path' => $base64Image,
            ])
        );

        $this->expectException(common_Exception::class);
        $this->expectExceptionMessage('Only tao files available for rendering through item preview');

        $this->subject->asset();
    }

    public function testNormalizeItemResponseCopiesIdentifierAndDefaultsPortableElements(): void
    {
        $response = [
            'content' => [
                'type' => 'qti',
                'data' => [
                    'identifier' => 'item-1',
                ],
            ],
        ];

        $result = $this->invoke('normalizeItemResponse', $response);

        $this->assertSame($response['content'], $result['itemData']);
        $this->assertSame('item-1', $result['itemIdentifier']);
        $this->assertInstanceOf(stdClass::class, $result['portableElements']);
    }

    private function createSubject(): PreviewerProxy
    {
        $serviceLocator = $this->createServiceLocator([
            SharedStimulusPreviewRegistry::class => $this->sharedStimulusPreviewRegistry,
        ]);

        /** @var PreviewerProxy $subject */
        $subject = (new ReflectionClass(PreviewerProxy::class))->newInstanceWithoutConstructor();
        $subject->setServiceLocator($serviceLocator);

        return $subject;
    }

    private function createServiceLocator(array $services): ServiceManager&MockObject
    {
        $serviceLocator = $this->createMock(ServiceManager::class);
        $serviceLocator
            ->method('getContainer')
            ->willReturn($serviceLocator);
        $serviceLocator
            ->method('get')
            ->willReturnCallback(
                static fn (string $serviceId) => $services[$serviceId] ?? null
            );
        $serviceLocator
            ->method('has')
            ->willReturnCallback(
                static fn (string $serviceId): bool => array_key_exists($serviceId, $services)
            );

        return $serviceLocator;
    }

    private function createSession(string $language): object
    {
        return new class ($language) {
            public function __construct(private string $language)
            {
            }

            public function getDataLanguage(): string
            {
                return $this->language;
            }
        };
    }

    private function createContentDetector(bool $isGzipableMime): ContentDetector&MockObject
    {
        $contentDetector = $this->createMock(ContentDetector::class);
        $contentDetector
            ->method('isGzipableMime')
            ->willReturn($isGzipableMime);

        return $contentDetector;
    }

    private function setGlobalServices(array $services): void
    {
        $serviceManager = $this->createMock(ServiceManager::class);
        $serviceManager
            ->method('get')
            ->willReturnCallback(
                static fn(string $serviceId) => $services[$serviceId] ?? null
            );

        ServiceManager::setServiceManager($serviceManager);
    }

    private function mockItem(string $uri): core_kernel_classes_Resource
    {
        $item = $this->createMock(core_kernel_classes_Resource::class);
        $item->method('getUri')->willReturn($uri);

        return $item;
    }

    private function invoke(string $methodName, ...$arguments)
    {
        $method = new ReflectionMethod($this->subject, $methodName);
        $method->setAccessible(true);

        return $method->invoke($this->subject, ...$arguments);
    }

    private function setFakeContext(): ?object
    {
        $contextClass = new ReflectionClass(\Context::class);
        $context = $contextClass->newInstanceWithoutConstructor();

        foreach (
            [
                'extensionName' => 'taoQtiTestPreviewer',
                'moduleName' => 'Previewer',
                'actionName' => 'asset',
                'viewData' => [],
                'behaviors' => [],
            ] as $propertyName => $value
        ) {
            $property = $contextClass->getProperty($propertyName);
            $property->setAccessible(true);
            $property->setValue($context, $value);
        }

        return $this->setContextInstance($context);
    }

    private function setContextInstance(?object $context): ?object
    {
        $property = new ReflectionProperty(\Context::class, 'instance');
        $property->setAccessible(true);
        $previous = $property->getValue();
        $property->setValue(null, $context);

        return $previous;
    }
}
