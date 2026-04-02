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
 * Copyright (c) 2021 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoQtiTestPreviewer\test\unit\models;

use oat\generis\test\TestCase;
use oat\taoMediaManager\model\sharedStimulus\css\service\ListStylesheetsService;
use oat\taoQtiTestPreviewer\models\PassageStylesService;
use PHPUnit\Framework\MockObject\MockObject;

class PassageStylesServiceTest extends TestCase
{
    /** @var ListStylesheetsService|MockObject */
    private $listStylesheetsServiceMock;

    protected function setUp(): void
    {
        $this->listStylesheetsServiceMock = $this->createMock(ListStylesheetsService::class);
    }

    public function testCheckAndInjectStylesInItemDataReturnsUnchangedWhenNoIncludes(): void
    {
        $content = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
                'body' => [
                    'body' => '<p>Simple content</p>',
                    'elements' => [],
                ],
                'stylesheets' => [],
            ],
        ];

        $result = PassageStylesService::checkAndInjectStylesInItemData(
            $content,
            $this->listStylesheetsServiceMock
        );

        $this->assertEquals($content, $result);
    }

    public function testCheckAndInjectStylesInItemDataInjectsStylesheets(): void
    {
        $encodedUri = 'https_2_example_0_org_3_i123456';

        $content = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
                'body' => [
                    'body' => '{{include-1}}',
                    'elements' => [
                        'include-1' => [
                            'serial' => 'include-1',
                            'qtiClass' => 'include',
                            'attributes' => [
                                'href' => 'taomedia://mediamanager/' . $encodedUri,
                            ],
                        ],
                    ],
                ],
                'stylesheets' => [],
            ],
        ];

        $this->listStylesheetsServiceMock
            ->expects($this->once())
            ->method('getList')
            ->willReturn([
                'path' => '/',
                'label' => 'Passage stylesheets',
                'childrenLimit' => 100,
                'total' => 1,
                'children' => [
                    [
                        'name' => 'style.css',
                        'uri' => '/style.css',
                        'mime' => 'text/css',
                        'filePath' => '/style.css',
                        'size' => 1024,
                    ],
                ],
            ]);

        $result = PassageStylesService::checkAndInjectStylesInItemData(
            $content,
            $this->listStylesheetsServiceMock
        );

        $this->assertArrayHasKey('stylesheet_include-1_0', $result['data']['stylesheets']);

        $stylesheet = $result['data']['stylesheets']['stylesheet_include-1_0'];
        $this->assertEquals('stylesheet', $stylesheet['qtiClass']);
        $this->assertEquals('all', $stylesheet['attributes']['media']);
        $this->assertEquals('text/css', $stylesheet['attributes']['type']);
        $this->assertEquals('taomedia://mediamanager/' . $encodedUri, $stylesheet['attributes']['includeHref']);
        $this->assertEquals('include-1', $stylesheet['attributes']['includeSerial']);
    }

    public function testCheckAndInjectStylesInItemDataHandlesMultipleStylesheets(): void
    {
        $encodedUri = 'https_2_example_0_org_3_i789';

        $content = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '{{passage}}',
                    'elements' => [
                        'passage' => [
                            'serial' => 'passage',
                            'qtiClass' => 'include',
                            'attributes' => [
                                'href' => 'taomedia://mediamanager/' . $encodedUri,
                            ],
                        ],
                    ],
                ],
                'stylesheets' => [],
            ],
        ];

        $this->listStylesheetsServiceMock
            ->method('getList')
            ->willReturn([
                'children' => [
                    ['name' => 'base.css'],
                    ['name' => 'theme.css'],
                ],
            ]);

        $result = PassageStylesService::checkAndInjectStylesInItemData(
            $content,
            $this->listStylesheetsServiceMock
        );

        $this->assertArrayHasKey('stylesheet_passage_0', $result['data']['stylesheets']);
        $this->assertArrayHasKey('stylesheet_passage_1', $result['data']['stylesheets']);
    }

    public function testCheckAndInjectStylesInItemDataSkipsNonTaomediaHrefs(): void
    {
        $content = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '{{external}}',
                    'elements' => [
                        'external' => [
                            'serial' => 'external',
                            'qtiClass' => 'include',
                            'attributes' => [
                                'href' => 'https://external.com/passage.xml',
                            ],
                        ],
                    ],
                ],
                'stylesheets' => [],
            ],
        ];

        $this->listStylesheetsServiceMock
            ->expects($this->never())
            ->method('getList');

        $result = PassageStylesService::checkAndInjectStylesInItemData(
            $content,
            $this->listStylesheetsServiceMock
        );

        $this->assertEmpty($result['data']['stylesheets']);
    }

    public function testCheckAndInjectStylesInItemDataHandlesNestedIncludes(): void
    {
        $encodedUri = 'https_2_example_0_org_3_nested';

        $content = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '{{interaction}}',
                    'elements' => [
                        'interaction' => [
                            'qtiClass' => 'choiceInteraction',
                            'prompt' => [
                                'body' => '{{nested-include}}',
                                'elements' => [
                                    'nested-include' => [
                                        'serial' => 'nested-include',
                                        'qtiClass' => 'include',
                                        'attributes' => [
                                            'href' => 'taomedia://mediamanager/' . $encodedUri,
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
                'stylesheets' => [],
            ],
        ];

        $this->listStylesheetsServiceMock
            ->method('getList')
            ->willReturn([
                'children' => [
                    ['name' => 'nested.css'],
                ],
            ]);

        $result = PassageStylesService::checkAndInjectStylesInItemData(
            $content,
            $this->listStylesheetsServiceMock
        );

        $this->assertArrayHasKey('stylesheet_nested-include_0', $result['data']['stylesheets']);
    }
}
