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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models\test\mapper;

use oat\generis\model\OntologyAwareTrait;
use oat\oatbox\service\ConfigurableService;
use oat\taoQtiTestPreviewer\models\test\TestPreviewConfig;
use oat\taoQtiTestPreviewer\models\test\TestPreviewMap;
use qtism\data\AssessmentTest;
use qtism\data\IAssessmentItem;
use qtism\data\NavigationMode;
use qtism\runtime\tests\Route;
use qtism\runtime\tests\RouteItem;

class TestPreviewMapper extends ConfigurableService implements TestPreviewMapperInterface
{
    use OntologyAwareTrait;

    public function map(AssessmentTest $test, Route $route, TestPreviewConfig $config): TestPreviewMap
    {
        $map = [
            'scope' => 'test',
            'parts' => []
        ];

        $routeItems = $route->getAllRouteItems();
        $checkInformational = $config->get(TestPreviewConfig::CHECK_INFORMATIONAL);
        $forceInformationalTitles = $config->get(TestPreviewConfig::REVIEW_FORCE_INFORMATION_TITLE);
        $displaySubsectionTitle = $config->get(TestPreviewConfig::REVIEW_DISPLAY_SUBSECTION_TITLE) === null
            ? true
            : $config->get(TestPreviewConfig::REVIEW_DISPLAY_SUBSECTION_TITLE);

        $map['title'] = $test->getTitle();
        $map['identifier'] = $test->getIdentifier();
        $map['className'] = $test->getQtiClassName();
        $map['toolName'] = $test->getToolName();
        $map['exclusivelyLinear'] = $test->isExclusivelyLinear();
        $map['hasTimeLimits'] = $test->hasTimeLimits();

        $offset = 0;
        $offsetSection = 0;
        $lastSection = null;

        /** @var RouteItem $routeItem */
        foreach ($routeItems as $routeItem) {
            $itemRefs = $this->getRouteItemAssessmentItemRefs($routeItem);

            /** @var IAssessmentItem $itemRef */
            foreach ($itemRefs as $itemRef) {
                $occurrence = $routeItem->getOccurence();

                $isItemInformational = true; //@TODO Implement this as a feature

                $testPart = $routeItem->getTestPart();
                $partId = $testPart->getIdentifier();
                $navigationMode = $testPart->getNavigationMode();

                if ($displaySubsectionTitle) {
                    $section = $routeItem->getAssessmentSection();
                } else {
                    $sections = $routeItem->getAssessmentSections()->getArrayCopy();
                    $section = $sections[0];
                }

                $sectionId = $section->getIdentifier();
                $itemId = $itemRef->getIdentifier();

                if ($lastSection != $sectionId) {
                    $offsetSection = 0;
                    $lastSection = $sectionId;
                }

                $itemUri = $itemRef->getHref();

                $itemInfos = [
                    'id' => $itemId,
                    'uri' => $itemUri,
                    'label' => $this->getItemLabel($itemUri),
                    'position' => $offset,
                    'occurrence' => $occurrence,
                    'remainingAttempts' => 0,
                    'answered' => 0,
                    'flagged' => false,
                    'viewed' => false,
                    'categories' => [],
                ];

                if ($checkInformational) {
                    $itemInfos['informational'] = $isItemInformational;
                }

                if ($itemRef->hasTimeLimits()) {
                    $itemInfos['timeConstraint'] = null; //@TODO Implement as feature
                }

                if (!isset($map['parts'][$partId])) {
                    $map['parts'][$partId]['id'] = $partId;
                    $map['parts'][$partId]['label'] = $partId;
                    $map['parts'][$partId]['position'] = $offset;
                    $map['parts'][$partId]['isLinear'] = $navigationMode == NavigationMode::LINEAR;

                    if ($testPart->hasTimeLimits()) {
                        $map['parts'][$partId]['timeConstraint'] = null; //@TODO Implement as feature
                    }
                }

                if (!isset($map['parts'][$partId]['sections'][$sectionId])) {
                    $map['parts'][$partId]['sections'][$sectionId]['id'] = $sectionId;
                    $map['parts'][$partId]['sections'][$sectionId]['label'] = $section->getTitle();
                    $map['parts'][$partId]['sections'][$sectionId]['isCatAdaptive'] = false; //@TODO Implement as feature
                    $map['parts'][$partId]['sections'][$sectionId]['position'] = $offset;

                    if ($section->hasTimeLimits()) {
                        $map['parts'][$partId]['sections'][$sectionId]['timeConstraint'] = null; //@TODO Implement as feature
                    }
                }

                $map['parts'][$partId]['sections'][$sectionId]['items'][$itemId] = $itemInfos;

                $this->updateStats($map, $itemInfos);
                $this->updateStats($map['parts'][$partId], $itemInfos);
                $this->updateStats($map['parts'][$partId]['sections'][$sectionId], $itemInfos);

                $offset++;

                if (!$forceInformationalTitles || ($forceInformationalTitles && !$isItemInformational)) {
                    $offsetSection++;
                }
            }
        }

        return new TestPreviewMap($map);
    }

    private function updateStats(array &$target, array $itemInfos): void
    {
        if (!isset($target['stats'])) {
            $target['stats'] = [
                'questions' => 0,
                'answered' => 0,
                'flagged' => 0,
                'viewed' => 0,
                'total' => 0,
                'questionsViewed' => 0,
            ];
        }

        if (empty($itemInfos['informational'])) {
            $target['stats']['questions']++;

            if (!empty($itemInfos['answered'])) {
                $target['stats']['answered']++;
            }

            if (!empty($itemInfos['viewed'])) {
                $target['stats']['questionsViewed']++;
            }
        }

        if (!empty($itemInfos['flagged'])) {
            $target['stats']['flagged']++;
        }

        if (!empty($itemInfos['viewed'])) {
            $target['stats']['viewed']++;
        }

        $target['stats']['total']++;
    }

    private function getRouteItemAssessmentItemRefs(RouteItem $routeItem): array
    {
        return [
            $routeItem->getAssessmentItemRef()
        ];
    }

    private function getItemLabel(string $itemUri): string
    {
        return $this->getResource($itemUri)->getLabel();
    }
}
