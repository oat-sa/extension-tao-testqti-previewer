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

namespace oat\taoQtiTestPreviewer\test\unit\models\test\service;

use ArrayObject;
use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewTimerBuilder;
use qtism\common\datatypes\QtiDuration;
use qtism\data\AssessmentItemRef;
use qtism\data\AssessmentSection;
use qtism\data\AssessmentTest;
use qtism\data\TestPart;
use qtism\data\TimeLimits;
use qtism\runtime\tests\Route;
use qtism\runtime\tests\RouteItem;

class TestPreviewTimerBuilderTest extends TestCase
{
    public function testBuildReturnsTimerDefinition(): void
    {
        $subject = new TestPreviewTimerBuilder();

        $test = $this->createTimedComponent(AssessmentTest::class, 'testId', 30, 120);
        $testPart = $this->createTimedComponent(TestPart::class, 'partId', null, 90);
        $section = $this->createTimedComponent(AssessmentSection::class, 'sectionId', 15, 60);
        $timedItem = $this->createTimedComponent(AssessmentItemRef::class, 'itemId', 10, 45);
        $untimedItem = $this->createTimedComponent(AssessmentItemRef::class, 'itemId2', null, null);

        $route = $this->createMock(Route::class);
        $route->method('getAllRouteItems')->willReturn([
            $this->createRouteItem($testPart, [$section], $timedItem),
            $this->createRouteItem($testPart, [$section], $untimedItem),
        ]);

        $this->assertSame(
            [
                'test' => [
                    'id' => 'testId',
                    'started' => false,
                    'minTime' => 30000,
                    'maxTime' => 120000,
                    'maxTimeRemaining' => 120000,
                    'initialValue' => null,
                ],
                'testParts' => [[
                    'id' => 'partId',
                    'started' => false,
                    'minTime' => 0,
                    'maxTime' => 90000,
                    'maxTimeRemaining' => 90000,
                    'initialValue' => null,
                ]],
                'sections' => [[
                    'id' => 'sectionId',
                    'started' => false,
                    'minTime' => 15000,
                    'maxTime' => 60000,
                    'maxTimeRemaining' => 60000,
                    'initialValue' => null,
                ]],
                'items' => [[
                    'id' => 'itemId',
                    'started' => false,
                    'minTime' => 10000,
                    'maxTime' => 45000,
                    'maxTimeRemaining' => 45000,
                    'initialValue' => null,
                ]],
                'extra' => null,
            ],
            $subject->build($test, $route)
        );
    }

    public function testBuildReturnsNullIfNoMaxTimeIsDefined(): void
    {
        $subject = new TestPreviewTimerBuilder();

        $test = $this->createTimedComponent(AssessmentTest::class, 'testId', 30, null);
        $testPart = $this->createTimedComponent(TestPart::class, 'partId', null, null);
        $section = $this->createTimedComponent(AssessmentSection::class, 'sectionId', 15, null);
        $item = $this->createTimedComponent(AssessmentItemRef::class, 'itemId', null, null);

        $route = $this->createMock(Route::class);
        $route->method('getAllRouteItems')->willReturn([
            $this->createRouteItem($testPart, [$section], $item),
        ]);

        $this->assertNull($subject->build($test, $route));
    }

    private function createTimedComponent(string $className, string $identifier, ?int $minTime, ?int $maxTime)
    {
        $component = $this->createMock($className);
        $component->method('getIdentifier')->willReturn($identifier);
        $component->method('getTimeLimits')->willReturn($this->createTimeLimits($minTime, $maxTime));

        return $component;
    }

    private function createRouteItem(TestPart $testPart, array $sections, AssessmentItemRef $item): RouteItem
    {
        $routeItem = $this->createMock(RouteItem::class);
        $routeItem->method('getTestPart')->willReturn($testPart);
        $routeItem->method('getAssessmentSections')->willReturn(new ArrayObject($sections));
        $routeItem->method('getAssessmentItemRef')->willReturn($item);

        return $routeItem;
    }

    private function createTimeLimits(?int $minTime, ?int $maxTime): ?TimeLimits
    {
        if ($minTime === null && $maxTime === null) {
            return null;
        }

        return new TimeLimits(
            $minTime !== null ? new QtiDuration(sprintf('PT%dS', $minTime)) : null,
            $maxTime !== null ? new QtiDuration(sprintf('PT%dS', $maxTime)) : null
        );
    }
}
