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
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoMediaManager\model\sharedStimulus {
    if (!class_exists(FindQuery::class)) {
        class FindQuery
        {
            public function __construct(private string $id)
            {
            }

            public function getId(): string
            {
                return $this->id;
            }
        }
    }

    if (!class_exists(SharedStimulus::class)) {
        class SharedStimulus implements \JsonSerializable
        {
            public function __construct(
                private string $id,
                private string $name,
                private string $languageId,
                private ?string $body = null
            ) {
            }

            public function jsonSerialize(): array
            {
                return [
                    'id' => $this->id,
                    'languageId' => $this->languageId,
                    'name' => $this->name,
                    'body' => (string) $this->body,
                ];
            }
        }
    }
}

namespace oat\taoMediaManager\model\sharedStimulus\repository {
    use oat\taoMediaManager\model\sharedStimulus\FindQuery;
    use oat\taoMediaManager\model\sharedStimulus\SharedStimulus;

    if (!class_exists(SharedStimulusRepository::class)) {
        class SharedStimulusRepository
        {
            public function find(FindQuery $query): SharedStimulus
            {
                return new SharedStimulus($query->getId(), '', '');
            }
        }
    }
}

namespace oat\taoMediaManager\model\sharedStimulus\parser {
    use oat\taoMediaManager\model\sharedStimulus\SharedStimulus;

    if (!class_exists(JsonQtiAttributeParser::class)) {
        class JsonQtiAttributeParser
        {
            public function parse(SharedStimulus $sharedStimulus): array
            {
                return [];
            }
        }
    }
}

namespace oat\taoMediaManager\model\sharedStimulus\css\dto {
    if (!class_exists(ListStylesheets::class)) {
        class ListStylesheets
        {
            public function __construct(private string $uri)
            {
            }

            public function getUri(): string
            {
                return $this->uri;
            }
        }
    }

    if (!class_exists(LoadStylesheet::class)) {
        class LoadStylesheet
        {
            public function __construct(private string $uri, private string $stylesheetUri)
            {
            }

            public function getUri(): string
            {
                return $this->uri;
            }

            public function getStylesheetUri(): string
            {
                return $this->stylesheetUri;
            }
        }
    }
}

namespace oat\taoMediaManager\model\sharedStimulus\css\service {
    use oat\taoMediaManager\model\sharedStimulus\css\dto\ListStylesheets;
    use oat\taoMediaManager\model\sharedStimulus\css\dto\LoadStylesheet;

    if (!class_exists(ListStylesheetsService::class)) {
        class ListStylesheetsService
        {
            public function getList(ListStylesheets $query): array
            {
                return [];
            }
        }
    }

    if (!class_exists(LoadStylesheetService::class)) {
        class LoadStylesheetService
        {
            public function load(LoadStylesheet $query)
            {
            }
        }
    }
}

namespace oat\taoMediaManager\model\sharedStimulus\specification {
    if (!class_exists(SharedStimulusResourceSpecification::class)) {
        class SharedStimulusResourceSpecification
        {
            public function isSatisfiedBy($item): bool
            {
                return false;
            }
        }
    }
}

namespace oat\taoMediaManager\model\validation {
    if (!class_exists(RequestValidator::class)) {
        class RequestValidator
        {
            public static function securityCheckPath(string $path): void
            {
                if (str_contains($path, '..')) {
                    throw new \common_exception_Error(sprintf('Invalid path "%s"', $path));
                }
            }
        }
    }
}

namespace oat\taoQtiTestPreviewer\test\unit\controller {
    use common_exception_Error;
    use core_kernel_classes_Resource;
    use GuzzleHttp\Psr7\ServerRequest;
    use GuzzleHttp\Psr7\Utils;
    use oat\generis\test\TestCase;
    use oat\oatbox\service\ServiceManager;
    use oat\tao\model\http\ContentDetector;
    use oat\tao\model\media\MediaBrowser;
    use oat\tao\model\media\MediaService;
    use oat\taoMediaManager\model\sharedStimulus\css\dto\LoadStylesheet;
    use oat\taoMediaManager\model\sharedStimulus\css\service\ListStylesheetsService;
    use oat\taoMediaManager\model\sharedStimulus\css\service\LoadStylesheetService;
    use oat\taoMediaManager\model\sharedStimulus\parser\JsonQtiAttributeParser;
    use oat\taoMediaManager\model\sharedStimulus\repository\SharedStimulusRepository;
    use oat\taoMediaManager\model\sharedStimulus\SharedStimulus;
    use oat\taoMediaManager\model\sharedStimulus\specification\SharedStimulusResourceSpecification;
    use oat\taoQtiTestPreviewer\controller\Previewer;
    use PHPUnit\Framework\MockObject\MockObject;
    use ReflectionClass;
    use ReflectionMethod;
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

        private SharedStimulusRepository $sharedStimulusRepository;

        private JsonQtiAttributeParser $sharedStimulusAttributesParser;

        private ListStylesheetsService $listStylesheetsService;

        private LoadStylesheetService $loadStylesheetService;

        private SharedStimulusResourceSpecification $sharedStimulusResourceSpecification;

        protected function setUp(): void
        {
            parent::setUp();

            $this->serverBackup = $_SERVER;
            $_SERVER['REQUEST_METHOD'] ??= 'GET';
            $this->contextInstanceBackup = $this->setFakeContext();
            $this->serviceManagerBackup = ServiceManager::getServiceManager();

            $this->sharedStimulusRepository = $this->createMock(SharedStimulusRepository::class);
            $this->sharedStimulusAttributesParser = $this->createMock(JsonQtiAttributeParser::class);
            $this->listStylesheetsService = $this->createMock(ListStylesheetsService::class);
            $this->loadStylesheetService = $this->createMock(LoadStylesheetService::class);
            $this->sharedStimulusResourceSpecification = $this->createMock(SharedStimulusResourceSpecification::class);

            $this->subject = $this->createSubject();
        }

        protected function tearDown(): void
        {
            $_SERVER = $this->serverBackup;
            $this->setContextInstance($this->contextInstanceBackup);

            if ($this->serviceManagerBackup instanceof ServiceManager) {
                ServiceManager::setServiceManager($this->serviceManagerBackup);
            }

            parent::tearDown();
        }

        public function testGetItemReturnsSharedStimulusPreviewResponseWhenItemHasNoCompiledContent(): void
        {
            $item = $this->mockItem(self::ITEM_URI);
            $session = $this->createSession('en-US');
            $itemsService = $this->createMock(taoItems_models_classes_ItemsService::class);
            $sharedStimulus = new SharedStimulus(self::ITEM_URI, 'Shared passage', 'en-US');

            $itemsService
                ->expects($this->once())
                ->method('hasItemContent')
                ->with($item, 'en-US')
                ->willReturn(false);

            $this->sharedStimulusResourceSpecification
                ->expects($this->once())
                ->method('isSatisfiedBy')
                ->with($item)
                ->willReturn(true);

            $this->sharedStimulusRepository
                ->expects($this->once())
                ->method('find')
                ->willReturn($sharedStimulus);

            $this->sharedStimulusAttributesParser
                ->expects($this->once())
                ->method('parse')
                ->with($sharedStimulus)
                ->willReturn([
                    'serial' => 'body_serial',
                    'attributes' => [
                        'xml:lang' => 'en-US',
                        'class' => 'passage',
                    ],
                    'body' => [
                        'serial' => 'body_serial',
                        'body' => '<p>Preview me</p>',
                        'elements' => [],
                    ],
                ]);

            $this->listStylesheetsService
                ->expects($this->once())
                ->method('getList')
                ->willReturn([
                    'children' => [
                        ['name' => 'tao-user-styles.css'],
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
            $sharedStimulus = new SharedStimulus(self::ITEM_URI, 'Shared passage', 'en-US');

            $itemsService
                ->expects($this->once())
                ->method('hasItemContent')
                ->with($item, 'en-US')
                ->willReturn(false);

            $this->sharedStimulusResourceSpecification
                ->expects($this->once())
                ->method('isSatisfiedBy')
                ->with($item)
                ->willReturn(true);

            $this->sharedStimulusRepository
                ->expects($this->once())
                ->method('find')
                ->willReturn($sharedStimulus);

            $this->sharedStimulusAttributesParser
                ->expects($this->once())
                ->method('parse')
                ->with($sharedStimulus)
                ->willThrowException(new RuntimeException('Boom'));

            $this->listStylesheetsService
                ->expects($this->never())
                ->method('getList');

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

            $this->sharedStimulusResourceSpecification
                ->expects($this->once())
                ->method('isSatisfiedBy')
                ->with($item)
                ->willReturn(true);

            $this->loadStylesheetService
                ->expects($this->once())
                ->method('load')
                ->with($this->callback(function (LoadStylesheet $query): bool {
                    return $query->getUri() === self::ITEM_URI
                        && $query->getStylesheetUri() === 'tao-user-styles.css';
                }))
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

            $this->sharedStimulusResourceSpecification
                ->expects($this->once())
                ->method('isSatisfiedBy')
                ->with($item)
                ->willReturn(false);

            $this->loadStylesheetService
                ->expects($this->never())
                ->method('load');

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

            $this->sharedStimulusResourceSpecification
                ->expects($this->once())
                ->method('isSatisfiedBy')
                ->with($item)
                ->willReturn(true);

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

        public function testCreateSharedStimulusResponseFallsBackWhenParsedBodyShapeIsInvalid(): void
        {
            $item = $this->mockItem('https://example.com/without-hash');
            $sharedStimulus = new SharedStimulus('https://example.com/without-hash', 'Shared passage', 'en-US');
            $identifier = md5('https://example.com/without-hash');

            $this->sharedStimulusRepository
                ->expects($this->once())
                ->method('find')
                ->willReturn($sharedStimulus);

            $this->sharedStimulusAttributesParser
                ->expects($this->once())
                ->method('parse')
                ->with($sharedStimulus)
                ->willReturn([
                    'body' => '<p>wrong shape</p>',
                ]);

            $this->listStylesheetsService
                ->expects($this->once())
                ->method('getList')
                ->willReturn([]);

            $result = $this->invoke('createSharedStimulusResponse', $item);

            $this->assertSame(
                [
                    'serial' => 'container_' . $identifier,
                    'body' => '',
                    'elements' => [],
                ],
                $result['content']['data']['body']
            );
            $this->assertSame(
                'response_container_' . $identifier,
                $result['content']['data']['responseProcessing']['serial']
            );
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
            /** @var PreviewerProxy $subject */
            $subject = (new ReflectionClass(PreviewerProxy::class))->newInstanceWithoutConstructor();
            $subject->setServiceLocator($this->getServiceLocatorMock([
                SharedStimulusRepository::class => $this->sharedStimulusRepository,
                JsonQtiAttributeParser::class => $this->sharedStimulusAttributesParser,
                ListStylesheetsService::class => $this->listStylesheetsService,
                LoadStylesheetService::class => $this->loadStylesheetService,
                SharedStimulusResourceSpecification::class => $this->sharedStimulusResourceSpecification,
            ]));

            return $subject;
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
            $property = new \ReflectionProperty(\Context::class, 'instance');
            $property->setAccessible(true);
            $previous = $property->getValue();
            $property->setValue(null, $context);

            return $previous;
        }
    }

    class PreviewerProxy extends Previewer
    {
        public array $jsonCalls = [];

        public array $resources = [];

        public ?object $session = null;

        protected function returnJson($data, $httpStatus = 200)
        {
            $this->jsonCalls[] = [
                'data' => $data,
                'status' => $httpStatus,
            ];
        }

        protected function getSession()
        {
            return $this->session;
        }

        public function getResource($uri)
        {
            if (!array_key_exists($uri, $this->resources)) {
                throw new RuntimeException(sprintf('Resource "%s" not configured in test.', $uri));
            }

            return $this->resources[$uri];
        }
    }
}
