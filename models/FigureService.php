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

namespace oat\taoQtiTestPreviewer\models;

/**
 * Service to check and process figure elements in item data.
 * Replaces figcaption element placeholders with actual HTML markup in body.
 */
class FigureService
{
    /**
     * Check all figures and replace figcaption elements by markup in body
     *
     * @param array $itemData Item data array
     * @return array Modified item data
     */
    public static function checkFigureInItemData(array $itemData): array
    {
        if (isset($itemData['data']['body'])) {
            $itemData['data']['body'] = self::checkFigureInElement($itemData['data']['body']);
        }

        return $itemData;
    }

    /**
     * Check all figures and replace figcaption element by markup in body in one Element
     *
     * @param array $element Element array
     * @return array Modified element
     */
    private static function checkFigureInElement(array $element): array
    {
        foreach (['elements', 'choices'] as $elementCollection) {
            if (!isset($element[$elementCollection]) || !is_array($element[$elementCollection])) {
                continue;
            }

            if ($elementCollection === 'choices' && array_is_list($element[$elementCollection])) {
                foreach ($element[$elementCollection] as $matchIndex => $choiceMatch) {
                    if (!is_array($choiceMatch)) {
                        continue;
                    }
                    foreach ($choiceMatch as $choiceIndex => $choice) {
                        if (!is_array($choice)) {
                            continue;
                        }
                        $element[$elementCollection][$matchIndex][$choiceIndex] = self::checkFigureInElement($choice);
                    }
                }
            } else {
                foreach ($element[$elementCollection] as $key => $childElement) {
                    if (!is_array($childElement)) {
                        continue;
                    }
                    if (isset($childElement['qtiClass']) && $childElement['qtiClass'] === 'figure') {
                        $element[$elementCollection][$key] = self::processFigureElement($childElement);
                    } else {
                        $element[$elementCollection][$key] = self::checkFigureInElement($childElement);
                    }
                }
            }
        }

        if (isset($element['body']) && is_array($element['body'])) {
            $element['body'] = self::checkFigureInElement($element['body']);
        }

        if (isset($element['prompt']) && is_array($element['prompt'])) {
            $element['prompt'] = self::checkFigureInElement($element['prompt']);
        }

        return $element;
    }

    /**
     * Process a figure element, replacing figcaption placeholders with HTML markup
     *
     * @param array $figureElement Figure element array
     * @return array Modified figure element
     */
    private static function processFigureElement(array $figureElement): array
    {
        if (!isset($figureElement['body']['elements'])) {
            return $figureElement;
        }

        foreach ($figureElement['body']['elements'] as $key => $elem) {
            if (isset($elem['qtiClass']) && $elem['qtiClass'] === 'figcaption') {
                $placeholder = '{{' . $key . '}}';
                $figcaptionContent = $figureElement['body']['elements'][$key]['body']['body'] ?? '';
                $replacement = '<figcaption>' . $figcaptionContent . '</figcaption>';

                $figureElement['body']['body'] = str_replace(
                    $placeholder,
                    $replacement,
                    $figureElement['body']['body']
                );

                unset($figureElement['body']['elements'][$key]);
            }
        }

        return $figureElement;
    }
}
