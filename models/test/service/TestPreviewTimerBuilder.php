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
 * Copyright (c) 2026 (original work) Open Assessment Technologies SA ;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models\test\service;

use qtism\data\AssessmentTest;
use qtism\data\QtiComponent;
use qtism\runtime\tests\Route;
use qtism\runtime\tests\RouteItem;

class TestPreviewTimerBuilder implements TestPreviewTimerBuilderInterface
{
    public function build(AssessmentTest $test, Route $route): ?array
    {
        $testPartTimers = [];
        $sectionTimers = [];
        $itemTimers = [];

        /** @var RouteItem $routeItem */
        foreach ($route->getAllRouteItems() as $routeItem) {
            $testPart = $routeItem->getTestPart();
            $testPartIdentifier = $testPart->getIdentifier();

            if (!array_key_exists($testPartIdentifier, $testPartTimers)) {
                $timer = $this->buildTimerDetail($testPart);
                if ($timer !== null) {
                    $testPartTimers[$testPartIdentifier] = $timer;
                }
            }

            foreach ($routeItem->getAssessmentSections() as $section) {
                $sectionIdentifier = $section->getIdentifier();

                if (!array_key_exists($sectionIdentifier, $sectionTimers)) {
                    $timer = $this->buildTimerDetail($section);
                    if ($timer !== null) {
                        $sectionTimers[$sectionIdentifier] = $timer;
                    }
                }
            }

            $item = $routeItem->getAssessmentItemRef();
            $itemIdentifier = $item->getIdentifier();

            if (!array_key_exists($itemIdentifier, $itemTimers)) {
                $timer = $this->buildTimerDetail($item);
                if ($timer !== null) {
                    $itemTimers[$itemIdentifier] = $timer;
                }
            }
        }

        $timerDefinition = [
            'test' => $this->buildTimerDetail($test),
            'testParts' => array_values($testPartTimers),
            'sections' => array_values($sectionTimers),
            'items' => array_values($itemTimers),
            'extra' => null,
        ];

        if (
            $timerDefinition['test'] === null
            && $timerDefinition['testParts'] === []
            && $timerDefinition['sections'] === []
            && $timerDefinition['items'] === []
        ) {
            return null;
        }

        return $timerDefinition;
    }

    private function buildTimerDetail(QtiComponent $component): ?array
    {
        $timeLimits = $component->getTimeLimits();

        if ($timeLimits === null || !$timeLimits->hasMaxTime()) {
            return null;
        }

        $maxTime = $timeLimits->getMaxTime()->getSeconds(true) * 1000;

        return [
            'id' => $component->getIdentifier(),
            'started' => false,
            'minTime' => $timeLimits->hasMinTime() ? $timeLimits->getMinTime()->getSeconds(true) * 1000 : 0,
            'maxTime' => $maxTime,
            'maxTimeRemaining' => $maxTime,
            'initialValue' => null,
        ];
    }
}
