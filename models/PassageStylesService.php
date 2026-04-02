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

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models;

use oat\taoMediaManager\model\sharedStimulus\css\dto\ListStylesheets;
use oat\taoMediaManager\model\sharedStimulus\css\service\ListStylesheetsService;
use tao_helpers_Uri;
use Throwable;

/**
 * Service to check and inject rich passage stylesheets into item data.
 */
class PassageStylesService
{
    private const TAOMEDIA_PREFIX = 'taomedia://mediamanager/';

    /**
     * Check all passage elements and inject rich passage styles in content
     *
     * @param array $content Item content array
     * @param ListStylesheetsService $listStylesheetsService Service to list passage stylesheets
     * @return array Modified content with stylesheets injected
     */
    public static function checkAndInjectStylesInItemData(
        array $content,
        ListStylesheetsService $listStylesheetsService
    ): array {
        $contentString = json_encode($content);

        if (strpos($contentString, '"qtiClass":"include"') === false) {
            return $content;
        }

        $passages = self::getPassagesFromContent($content);

        return self::injectPassagesStylesInContent($passages, $content, $listStylesheetsService);
    }

    /**
     * Get all passage elements (qtiClass: 'include') from content
     *
     * @param array $content Item content array
     * @return array Associative array of include elements keyed by serial
     */
    private static function getPassagesFromContent(array $content): array
    {
        $includes = [];

        if (isset($content['data']['body'])) {
            $includes = array_merge($includes, self::getPassagesFromElement($content['data']['body']));
        }

        return $includes;
    }

    /**
     * Get all passage elements (qtiClass: 'include') from an element
     *
     * @param array $element Element array
     * @return array Associative array of include elements keyed by serial
     */
    private static function getPassagesFromElement(array $element): array
    {
        $includes = [];

        foreach (['elements', 'choices'] as $elementCollection) {
            if (!isset($element[$elementCollection]) || !is_array($element[$elementCollection])) {
                continue;
            }

            if ($elementCollection === 'choices' && array_is_list($element[$elementCollection])) {
                foreach ($element[$elementCollection] as $choiceMatch) {
                    if (!is_array($choiceMatch)) {
                        continue;
                    }
                    foreach ($choiceMatch as $choice) {
                        if (!is_array($choice)) {
                            continue;
                        }
                        $includes = array_merge($includes, self::getPassagesFromElement($choice));
                    }
                }
            } else {
                foreach ($element[$elementCollection] as $childElement) {
                    if (!is_array($childElement)) {
                        continue;
                    }
                    if (isset($childElement['qtiClass']) && $childElement['qtiClass'] === 'include') {
                        $includes[$childElement['serial']] = $childElement;
                    } else {
                        $includes = array_merge($includes, self::getPassagesFromElement($childElement));
                    }
                }
            }
        }

        if (isset($element['body']) && is_array($element['body'])) {
            $includes = array_merge($includes, self::getPassagesFromElement($element['body']));
        }

        if (isset($element['prompt']) && is_array($element['prompt'])) {
            $includes = array_merge($includes, self::getPassagesFromElement($element['prompt']));
        }

        return $includes;
    }

    /**
     * Check all passage elements and inject passage styles in content with absolute href
     *
     * @param array $passages Array of include elements
     * @param array $content Item content array
     * @param ListStylesheetsService $listStylesheetsService Service to list passage stylesheets
     * @return array Modified content with stylesheets injected
     */
    private static function injectPassagesStylesInContent(
        array $passages,
        array $content,
        ListStylesheetsService $listStylesheetsService
    ): array {
        $processedUris = [];

        if (!isset($content['data']['stylesheets'])) {
            $content['data']['stylesheets'] = [];
        }

        foreach ($passages as $id => $elem) {
            $passageHref = $elem['attributes']['href'] ?? '';

            if (strpos($passageHref, self::TAOMEDIA_PREFIX) !== 0) {
                continue;
            }

            $passageUri = tao_helpers_Uri::decode(str_replace(self::TAOMEDIA_PREFIX, '', $passageHref));

            if (in_array($passageUri, $processedUris, true)) {
                continue;
            }

            $processedUris[] = $passageUri;

            try {
                $dto = new ListStylesheets($passageUri);
                $response = $listStylesheetsService->getList($dto);

                foreach ($response['children'] as $index => $stylesheet) {
                    $stylesheetHref = _url(
                        'loadStylesheet',
                        'SharedStimulusStyling',
                        'taoMediaManager',
                        [
                            'uri' => $passageUri,
                            'stylesheet' => $stylesheet['name']
                        ]
                    );

                    $serial = sprintf('stylesheet_%s_%d', $id, $index);

                    $content['data']['stylesheets'][$serial] = [
                        'qtiClass' => 'stylesheet',
                        'attributes' => [
                            'href' => $stylesheetHref,
                            'media' => 'all',
                            'title' => '',
                            'type' => 'text/css',
                            'includeHref' => $passageHref,
                            'includeSerial' => $elem['serial'],
                        ],
                        'serial' => $serial,
                    ];
                }
            } catch (Throwable $e) {
                continue;
            }
        }

        return $content;
    }
}
