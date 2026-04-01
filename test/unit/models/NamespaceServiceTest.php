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
 * Foundation, Inc., 31 Milk St # 960789 Boston, MA 02196 USA.
 *
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoQtiTestPreviewer\test\unit\models;

use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\NamespaceService;

class NamespaceServiceTest extends TestCase
{
    public function testRemoveNamespacesInItemDataStripsNamespacePrefixes(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
                'body' => [
                    'serial' => 'body-serial',
                    'body' => '<div><qh5:article>Content</qh5:article><qh5:section>More</qh5:section></div>',
                    'elements' => [],
                ],
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals(
            '<div><article>Content</article><section>More</section></div>',
            $result['data']['body']['body'],
            'Namespace prefixes should be stripped from HTML5 tags'
        );
    }

    public function testRemoveNamespacesInItemDataHandlesClosingTags(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '<qh5:figure><img src="test.jpg"/></qh5:figure>',
                    'elements' => [],
                ],
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals(
            '<figure><img src="test.jpg"/></figure>',
            $result['data']['body']['body']
        );
    }

    public function testRemoveNamespacesInItemDataReturnsUnchangedWhenNoNamespaces(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '<div><p>Simple content</p></div>',
                    'elements' => [],
                ],
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals($itemData, $result);
    }

    public function testRemoveNamespacesInItemDataReturnsUnchangedWhenNoBody(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals($itemData, $result);
    }

    public function testRemoveNamespacesInItemDataHandlesNestedElements(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '{{interaction}}',
                    'elements' => [
                        'interaction' => [
                            'qtiClass' => 'choiceInteraction',
                            'body' => [
                                'body' => '<qh5:aside>Nested content with <qh5:ruby>ruby text</qh5:ruby></qh5:aside>',
                                'elements' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals(
            '<aside>Nested content with <ruby>ruby text</ruby></aside>',
            $result['data']['body']['elements']['interaction']['body']['body']
        );
    }

    public function testRemoveNamespacesInItemDataHandlesPromptElement(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'body' => [
                    'body' => '{{interaction}}',
                    'elements' => [
                        'interaction' => [
                            'qtiClass' => 'choiceInteraction',
                            'prompt' => [
                                'body' => '<qh5:header>Title</qh5:header><qh5:footer>Footer</qh5:footer>',
                                'elements' => [],
                            ],
                            'choices' => [
                                'choice-a' => [
                                    'body' => [
                                        'body' => 'Option A',
                                        'elements' => [],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = NamespaceService::removeNamespacesInItemData($itemData);

        $this->assertEquals(
            '<header>Title</header><footer>Footer</footer>',
            $result['data']['body']['elements']['interaction']['prompt']['body']
        );
    }
}
