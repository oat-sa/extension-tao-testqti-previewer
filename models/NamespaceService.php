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
 * Service to remove XML namespace prefixes from item data markup.
 * Removes namespace prefixes like qh5: from HTML tags (e.g., <qh5:video> becomes <video>).
 */
class NamespaceService
{
    /**
     * HTML5 elements that need namespace prefix handling
     *
     * @see http://www.imsglobal.org/xsd/qti/qtiv2p2/imsqti_v2p2.xsd
     */
    private const PREFIXED_ELEMENTS = 'article|aside|bdi|figure|footer|header|nav|rb|rp|rt|rtc|ruby|section';

    /**
     * Remove namespace prefixes from all elements in item data
     *
     * @param array $itemData Item data array
     * @return array Modified item data with namespaces removed
     */
    public static function removeNamespacesInItemData(array $itemData): array
    {
        if (isset($itemData['data']['body'])) {
            $itemData['data']['body'] = self::removeNamespaces($itemData['data']['body']);
        }

        return $itemData;
    }

    /**
     * Recursively remove namespace prefixes from an element and its children
     *
     * @param array $element Element array
     * @return array Modified element with namespaces removed
     */
    private static function removeNamespaces(array $element): array
    {
        foreach (['elements', 'choices'] as $elementCollection) {
            if (!isset($element[$elementCollection]) || !is_array($element[$elementCollection])) {
                continue;
            }

            if ($elementCollection === 'choices' && self::isIndexedArray($element[$elementCollection])) {
                foreach ($element[$elementCollection] as $matchIndex => $choiceMatch) {
                    if (!is_array($choiceMatch)) {
                        continue;
                    }
                    foreach ($choiceMatch as $choiceIndex => $choice) {
                        if (!is_array($choice)) {
                            continue;
                        }
                        $element[$elementCollection][$matchIndex][$choiceIndex] = self::removeNamespaces($choice);
                    }
                }
            } else {
                foreach ($element[$elementCollection] as $key => $childElement) {
                    if (!is_array($childElement)) {
                        continue;
                    }
                    $element[$elementCollection][$key] = self::removeNamespaces($childElement);
                }
            }
        }

        if (isset($element['body'])) {
            if (is_string($element['body'])) {
                $element['body'] = self::stripNs($element['body']);
            } elseif (is_array($element['body']) && isset($element['body']['body'])) {
                $element['body']['body'] = self::stripNs($element['body']['body']);
                $element['body'] = self::removeNamespaces($element['body']);
            }
        }

        if (isset($element['prompt']) && is_array($element['prompt']) && isset($element['prompt']['body'])) {
            $element['prompt']['body'] = self::stripNs($element['prompt']['body']);
            $element['prompt'] = self::removeNamespaces($element['prompt']);
        }

        return $element;
    }

    /**
     * Strip namespace prefixes from XML/HTML markup for specific HTML5 elements
     * Transforms tags like <qh5:figure> to <figure> and </qh5:figure> to </figure>
     *
     * @param string $markup The markup string to process
     * @return string Markup with namespace prefixes removed from HTML5 elements
     */
    private static function stripNs(string $markup): string
    {
        $openPattern = '/<[\w]+:(' . self::PREFIXED_ELEMENTS . ')/i';
        $markup = preg_replace($openPattern, '<$1', $markup);

        $closePattern = '/<\/[\w]+:(' . self::PREFIXED_ELEMENTS . ')>/i';
        $markup = preg_replace($closePattern, '</$1>', $markup);

        return $markup;
    }

    /**
     * Check if an array is an indexed (sequential) array rather than associative
     *
     * @param array $array
     * @return bool
     */
    private static function isIndexedArray(array $array): bool
    {
        if (empty($array)) {
            return true;
        }
        return array_keys($array) === range(0, count($array) - 1);
    }
}
