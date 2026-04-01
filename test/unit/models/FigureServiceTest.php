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
use oat\taoQtiTestPreviewer\models\FigureService;

class FigureServiceTest extends TestCase
{
    public function testCheckFigureInItemDataReplacesFigcaptionPlaceholder(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
                'body' => [
                    'serial' => 'body-serial',
                    'body' => '<p>Content</p>{{figure-1}}',
                    'elements' => [
                        'figure-1' => [
                            'serial' => 'figure-1',
                            'qtiClass' => 'figure',
                            'body' => [
                                'serial' => 'figure-body',
                                'body' => '{{img-1}}{{caption-1}}',
                                'elements' => [
                                    'img-1' => [
                                        'serial' => 'img-1',
                                        'qtiClass' => 'img',
                                        'attributes' => ['src' => 'image.jpg'],
                                    ],
                                    'caption-1' => [
                                        'serial' => 'caption-1',
                                        'qtiClass' => 'figcaption',
                                        'body' => [
                                            'serial' => 'caption-body',
                                            'body' => 'This is the caption text',
                                            'elements' => [],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $result = FigureService::checkFigureInItemData($itemData);

        $figureBody = $result['data']['body']['elements']['figure-1']['body'];

        $this->assertStringContainsString(
            '<figcaption>This is the caption text</figcaption>',
            $figureBody['body'],
            'Figcaption placeholder should be replaced with HTML markup'
        );

        $this->assertStringNotContainsString(
            '{{caption-1}}',
            $figureBody['body'],
            'Placeholder should no longer exist'
        );

        $this->assertArrayNotHasKey(
            'caption-1',
            $figureBody['elements'],
            'Figcaption element should be removed from elements array'
        );

        $this->assertArrayHasKey(
            'img-1',
            $figureBody['elements'],
            'Non-figcaption elements should remain'
        );
    }

    public function testCheckFigureInItemDataReturnsUnchangedWhenNoFigures(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'test-item',
                'body' => [
                    'serial' => 'body-serial',
                    'body' => '<p>Simple content without figures</p>',
                    'elements' => [],
                ],
            ],
        ];

        $result = FigureService::checkFigureInItemData($itemData);

        $this->assertEquals($itemData, $result);
    }

    public function testCheckFigureInItemDataHandlesFigureInChoiceInteractionPrompt(): void
    {
        $itemData = [
            'type' => 'qti',
            'data' => [
                'identifier' => 'choice-item',
                'body' => [
                    'serial' => 'body-serial',
                    'body' => '{{choice-interaction}}',
                    'elements' => [
                        'choice-interaction' => [
                            'serial' => 'choice-interaction',
                            'qtiClass' => 'choiceInteraction',
                            'attributes' => [
                                'responseIdentifier' => 'RESPONSE',
                                'shuffle' => false,
                                'maxChoices' => 1,
                            ],
                            'prompt' => [
                                'serial' => 'prompt-serial',
                                'body' => '<p>Look at the image below:</p>{{prompt-figure}}',
                                'elements' => [
                                    'prompt-figure' => [
                                        'serial' => 'prompt-figure',
                                        'qtiClass' => 'figure',
                                        'attributes' => [],
                                        'body' => [
                                            'serial' => 'prompt-figure-body',
                                            'body' => '{{prompt-img}}{{prompt-caption}}',
                                            'elements' => [
                                                'prompt-img' => [
                                                    'serial' => 'prompt-img',
                                                    'qtiClass' => 'img',
                                                    'attributes' => [
                                                        'src' => 'question-image.jpg',
                                                        'alt' => 'Question image',
                                                    ],
                                                ],
                                                'prompt-caption' => [
                                                    'serial' => 'prompt-caption',
                                                    'qtiClass' => 'figcaption',
                                                    'body' => [
                                                        'serial' => 'prompt-caption-body',
                                                        'body' => 'Figure 1: Sample diagram',
                                                        'elements' => [],
                                                    ],
                                                ],
                                            ],
                                        ],
                                    ],
                                ],
                            ],
                            'choices' => [
                                'choice-a' => [
                                    'serial' => 'choice-a',
                                    'qtiClass' => 'simpleChoice',
                                    'attributes' => ['identifier' => 'A'],
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

        $result = FigureService::checkFigureInItemData($itemData);

        $promptFigureBody = $result['data']['body']['elements']['choice-interaction']['prompt']['elements']['prompt-figure']['body'];

        $this->assertStringContainsString(
            '<figcaption>Figure 1: Sample diagram</figcaption>',
            $promptFigureBody['body'],
            'Figcaption in prompt should be replaced with HTML markup'
        );

        $this->assertStringNotContainsString(
            '{{prompt-caption}}',
            $promptFigureBody['body'],
            'Placeholder in prompt should no longer exist'
        );

        $this->assertArrayNotHasKey(
            'prompt-caption',
            $promptFigureBody['elements'],
            'Figcaption element should be removed from prompt figure elements'
        );

        $this->assertArrayHasKey(
            'prompt-img',
            $promptFigureBody['elements'],
            'Image element should remain in prompt figure'
        );
    }
}
