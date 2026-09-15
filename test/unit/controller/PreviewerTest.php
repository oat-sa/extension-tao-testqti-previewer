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
}

namespace oat\taoMediaManager\model\sharedStimulus\css\service {
    use oat\taoMediaManager\model\sharedStimulus\css\dto\ListStylesheets;

    if (!class_exists(ListStylesheetsService::class)) {
        class ListStylesheetsService
        {
            public function getList(ListStylesheets $query): array
            {
                return [];
            }
        }
    }
}

namespace oat\taoQtiTestPreviewer\test\unit\controller {
    use core_kernel_classes_Resource;
    use oat\generis\test\TestCase;
    use oat\taoMediaManager\model\sharedStimulus\css\service\ListStylesheetsService;
    use oat\taoMediaManager\model\sharedStimulus\parser\JsonQtiAttributeParser;
    use oat\taoMediaManager\model\sharedStimulus\repository\SharedStimulusRepository;
    use oat\taoMediaManager\model\sharedStimulus\SharedStimulus;
    use oat\taoQtiTestPreviewer\controller\Previewer;
    use ReflectionClass;
    use ReflectionMethod;
    use stdClass;

    class PreviewerTest extends TestCase
    {
        private const ITEM_URI = 'https://example.com/tao.rdf#i123';

        private Previewer $subject;

        private ?object $contextInstanceBackup = null;

        private array $serverBackup = [];

        private SharedStimulusRepository $sharedStimulusRepository;

        private JsonQtiAttributeParser $sharedStimulusAttributesParser;

        private ListStylesheetsService $listStylesheetsService;

        protected function setUp(): void
        {
            parent::setUp();

            $this->serverBackup = $_SERVER;
            $_SERVER['REQUEST_METHOD'] ??= 'GET';
            $this->contextInstanceBackup = $this->setFakeContext();

            $this->sharedStimulusRepository = $this->createMock(SharedStimulusRepository::class);
            $this->sharedStimulusAttributesParser = $this->createMock(JsonQtiAttributeParser::class);
            $this->listStylesheetsService = $this->createMock(ListStylesheetsService::class);

            $this->subject = (new ReflectionClass(Previewer::class))->newInstanceWithoutConstructor();
            $this->subject->setServiceLocator($this->getServiceLocatorMock([
                SharedStimulusRepository::class => $this->sharedStimulusRepository,
                JsonQtiAttributeParser::class => $this->sharedStimulusAttributesParser,
                ListStylesheetsService::class => $this->listStylesheetsService,
            ]));
        }

        protected function tearDown(): void
        {
            $_SERVER = $this->serverBackup;
            $this->setContextInstance($this->contextInstanceBackup);

            parent::tearDown();
        }

        public function testCreateSharedStimulusResponseBuildsPreviewerItemShape(): void
        {
            $item = $this->mockItem(self::ITEM_URI);
            $sharedStimulus = new SharedStimulus(self::ITEM_URI, 'Shared passage', 'en-US');

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
                    ['ignored' => true],
                ],
            ]);

            $result = $this->invoke('createSharedStimulusResponse', $item);

            $this->assertSame('qti', $result['content']['type']);
            $this->assertSame('i123', $result['content']['data']['identifier']);
            $this->assertSame('item_i123', $result['content']['data']['serial']);
            $this->assertSame('assessmentItem', $result['content']['data']['qtiClass']);
            $this->assertSame('<p>Preview me</p>', $result['content']['data']['body']['body']);
            $this->assertSame(
                [
                'identifier' => 'i123',
                'title' => 'Shared passage',
                'xml:lang' => 'en-US',
                'class' => 'passage',
                ],
                $result['content']['data']['attributes']
            );
            $this->assertInstanceOf(stdClass::class, $result['content']['data']['namespaces']);
            $this->assertInstanceOf(stdClass::class, $result['content']['data']['response']);
            $this->assertInstanceOf(stdClass::class, $result['content']['data']['responses']);
            $this->assertSame([], $result['content']['assets']);
            $this->assertSame(
                [
                'qtiClass' => 'stylesheet',
                'attributes' => [
                    'href' => 'css/tao-user-styles.css',
                    'media' => 'all',
                    'title' => '',
                    'type' => 'text/css',
                ],
                'serial' => 'preview_0',
                ],
                $result['content']['data']['stylesheets']['preview_0']
            );
            $this->assertSame('response_body_serial', $result['content']['data']['responseProcessing']['serial']);
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
}
