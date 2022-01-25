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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\test\unit\models\test\factory;

use core_kernel_classes_Resource;
use oat\generis\model\data\Ontology;
use oat\generis\test\TestCase;
use oat\taoQtiItem\model\qti\Service;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapper;
use oat\taoQtiTestPreviewer\models\test\TestPreviewConfig;
use oat\taoQtiTestPreviewer\models\test\TestPreviewMap;
use PHPUnit\Framework\MockObject\MockObject;
use qtism\common\collections\StringCollection;
use qtism\data\AssessmentItemRef;
use qtism\data\AssessmentSection;
use qtism\data\AssessmentTest;
use qtism\data\ExtendedAssessmentItemRef;
use qtism\data\ItemSessionControl;
use qtism\data\TestPart;
use qtism\runtime\tests\Route;
use qtism\runtime\tests\RouteItem;

class TestPreviewMapperTest extends TestCase
{
    /** @var TestPreviewMapper */
    private $subject;

    /** @var Ontology|MockObject */
    private $ontology;

    protected function setUp(): void
    {
        $this->ontology = $this->createMock(Ontology::class);
        $this->subject = new TestPreviewMapper();
        $this->subject->setServiceLocator(
            $this->getServiceLocatorMock(
                [
                    Ontology::SERVICE_ID => $this->ontology,
                    Service::class => $this->createMock(Service::class),
                ]
            )
        );
    }

    public function testMapEmptyTest(): void
    {
        static::assertEquals(
            new TestPreviewMap(
                [
                    'scope' => 'test',
                    'parts' => [],
                    'title' => 'testTitle',
                    'identifier' => 'testIdentifier',
                    'className' => 'testQtiClassName',
                    'toolName' => 'testToolName',
                    'exclusivelyLinear' => true,
                    'hasTimeLimits' => true,
                ]
            ),
            $this->subject->map($this->expectsTest(), $this->expectsRoute([]), new TestPreviewConfig())
        );
    }

    public function testMapFullTest(): void
    {
        $itemId = 'itemId';
        $sectionTitle = 'sectionTitle';
        $categories = [
            'x-tao-test',
            'x-tao-itemusage-informational'
        ];

        $testPart = $this->expectsTestPart('partId');
        $section = $this->expectSection('sectionId', $sectionTitle);
        $itemRef = $this->expectsItemRef('itemUri', $itemId, $categories);
        $routeItem = $this->expectRouteItem($itemRef, $testPart, $section);

        $this->expectsItemResource('itemUri', 'testLabel');

        static::assertEquals(
            new TestPreviewMap($this->getFullMapData($itemId, $sectionTitle, $categories)),
            $this->subject->map($this->expectsTest(), $this->expectsRoute([$routeItem]), new TestPreviewConfig())
        );
    }

    public function testInformationalItemDetectionByCategories(): void
    {
        $itemId = 'itemId';
        $sectionTitle = 'sectionTitle';
        $categories = [
            'x-tao-test',
            'x-tao-itemusage-informational'
        ];

        $config = new TestPreviewConfig([TestPreviewConfig::CHECK_INFORMATIONAL => true]);

        $testPart = $this->expectsTestPart('partId');
        $section = $this->expectSection('sectionId', $sectionTitle);
        $itemRef = $this->expectsItemRef('itemUri', $itemId, $categories);
        $routeItem = $this->expectRouteItem($itemRef, $testPart, $section);

        $this->expectsItemResource('itemUri', 'testLabel');

        static::assertEquals(
            new TestPreviewMap($this->getFullMapData($itemId, $sectionTitle, $categories, true)),
            $this->subject->map($this->expectsTest(), $this->expectsRoute([$routeItem]), $config)
        );
    }

    public function testInformationalItemDetectionByResponseDeclarations(): void
    {
        $itemId = 'itemId';
        $sectionTitle = 'sectionTitle';
        $categories = [
            'x-tao-test'
        ];

        $config = new TestPreviewConfig([TestPreviewConfig::CHECK_INFORMATIONAL => true]);

        $testPart = $this->expectsTestPart('partId');
        $section = $this->expectSection('sectionId', $sectionTitle);
        $itemRef = $this->expectsExtendedItemRef('itemUri', $itemId, $categories);
        $routeItem = $this->expectRouteItem($itemRef, $testPart, $section);

        $this->expectsItemResource('itemUri', 'testLabel');

        static::assertEquals(
            new TestPreviewMap($this->getFullMapData($itemId, $sectionTitle, $categories, true)),
            $this->subject->map($this->expectsTest(), $this->expectsRoute([$routeItem]), $config)
        );
    }

    /**
     * @dataProvider provideAllowSkippingVariations
     */
    public function testAllowSkipping(bool $doesAllowSkipping, bool $hasSessionControl = true): void
    {
        $itemId = 'itemId';
        $sectionTitle = 'sectionTitle';
        $categories = [
            'x-tao-test'
        ];

        $config = new TestPreviewConfig([TestPreviewConfig::CHECK_INFORMATIONAL => true]);

        $testPart = $this->expectsTestPart('partId');
        $section = $this->expectSection('sectionId', $sectionTitle);

        $sessionControl = null;
        if ($hasSessionControl) {
            $sessionControl = $this->createMock(ItemSessionControl::class);
            $sessionControl->expects($this->once())->method('doesAllowSkipping')->willReturn($doesAllowSkipping);
        }

        $itemRef = $this->expectsExtendedItemRef('itemUri', $itemId, $categories, $sessionControl);
        $routeItem = $this->expectRouteItem($itemRef, $testPart, $section);

        $this->expectsItemResource('itemUri', 'testLabel');

        static::assertEquals(
            new TestPreviewMap($this->getFullMapData($itemId, $sectionTitle, $categories, true, $doesAllowSkipping)),
            $this->subject->map($this->expectsTest(), $this->expectsRoute([$routeItem]), $config)
        );
    }

    public function provideAllowSkippingVariations(): array
    {
        return [
            'without-session-control-set-default-allow-skipping' => [
                'doesAllowSkipping' => true,
                'hasSessionControl' => false,
            ],
            'allow-skipping-disabled' => [
                'doesAllowSkipping' => false,
            ],
            'allow-skipping-enabled' => [
                'doesAllowSkipping' => true,
            ],
        ];
    }

    private function getFullMapData(
        string $itemId,
        string $sectionTitle,
        array $categories,
        bool $isInformational = false,
        bool $allowSkipping = true
    ): array {
        $data = [
            'scope' => 'test',
            'parts' => [
                'partId' => [
                    'id' => 'partId',
                    'label' => 'partId',
                    'position' => 0,
                    'isLinear' => true,
                    'sections' => [
                        'sectionId' => [
                            'id' => 'sectionId',
                            'label' => $sectionTitle,
                            'isCatAdaptive' => false,
                            'position' => 0,
                            'items' => [
                                'itemId' => [
                                    'id' => $itemId,
                                    'uri' => 'itemUri',
                                    'label' => 'testLabel',
                                    'position' => 0,
                                    'occurrence' => null,
                                    'remainingAttempts' => -1,
                                    'answered' => 0,
                                    'flagged' => false,
                                    'viewed' => false,
                                    'categories' => $categories,
                                    'allowSkipping' => $allowSkipping,
                                ],
                            ],
                            'stats' => [
                                'questions' => 1,
                                'answered' => 0,
                                'flagged' => 0,
                                'viewed' => 0,
                                'total' => 1,
                                'questionsViewed' => 0,
                            ],
                        ],
                    ],
                    'stats' => [
                        'questions' => 1,
                        'answered' => 0,
                        'flagged' => 0,
                        'viewed' => 0,
                        'total' => 1,
                        'questionsViewed' => 0,
                    ],
                ],
            ],
            'title' => 'testTitle',
            'identifier' => 'testIdentifier',
            'className' => 'testQtiClassName',
            'toolName' => 'testToolName',
            'exclusivelyLinear' => true,
            'hasTimeLimits' => true,
            'stats' => [
                'questions' => 1,
                'answered' => 0,
                'flagged' => 0,
                'viewed' => 0,
                'total' => 1,
                'questionsViewed' => 0,
            ],
        ];

        if ($isInformational) {
            $data['parts']['partId']['sections']['sectionId']['items']['itemId']['informational'] = true;
            $data['parts']['partId']['sections']['sectionId']['stats']['questions'] = 0;
            $data['parts']['partId']['stats']['questions'] = 0;
            $data['stats']['questions'] = 0;
        }

        return $data;
    }

    private function expectsItemResource(string $itemUri, string $label): core_kernel_classes_Resource
    {
        $itemResource = $this->createMock(core_kernel_classes_Resource::class);

        $itemResource->method('getLabel')
            ->willReturn($label);

        $this->ontology
            ->method('getResource')
            ->with($itemUri)
            ->willReturn($itemResource);

        return $itemResource;
    }

    private function expectsItemRef(string $itemUri, string $itemId, array $categories): AssessmentItemRef
    {
        $itemRef = $this->createMock(AssessmentItemRef::class);

        return $this->mockItemRefMethods($itemRef, $itemUri, $itemId, $categories);
    }

    private function expectsExtendedItemRef(
        string $itemUri,
        string $itemId,
        array $categories,
        ItemSessionControl $sessionControl = null
    ): ExtendedAssessmentItemRef {
        $itemRef = $this->createMock(ExtendedAssessmentItemRef::class);

        $itemRef->method('getResponseDeclarations')
            ->willReturn([]);

        return $this->mockItemRefMethods($itemRef, $itemUri, $itemId, $categories, $sessionControl);
    }

    /**
     * @param AssessmentItemRef|ExtendedAssessmentItemRef $itemRef
     * @return AssessmentItemRef|ExtendedAssessmentItemRef
     */
    private function mockItemRefMethods($itemRef, string $itemUri, string $itemId, array $categories, ItemSessionControl $sessionControl = null)
    {
        $itemRef->method('getHref')
            ->willReturn($itemUri);

        $itemRef->method('getIdentifier')
            ->willReturn($itemId);

        $itemRef->method('getCategories')
            ->willReturn(
                new StringCollection($categories)
            );

        $itemRef->method('getItemSessionControl')
            ->willReturn($sessionControl);

        return $itemRef;
    }

    private function expectsTestPart(string $partId): TestPart
    {
        $testPart = $this->createMock(TestPart::class);

        $testPart->method('getIdentifier')
            ->willReturn($partId);

        return $testPart;
    }

    private function expectsTest(): AssessmentTest
    {
        $assessmentTest = $this->createMock(AssessmentTest::class);

        $assessmentTest->method('getTitle')
            ->willReturn('testTitle');

        $assessmentTest->method('getIdentifier')
            ->willReturn('testIdentifier');

        $assessmentTest->method('getQtiClassName')
            ->willReturn('testQtiClassName');

        $assessmentTest->method('getToolName')
            ->willReturn('testToolName');

        $assessmentTest->method('isExclusivelyLinear')
            ->willReturn(true);

        $assessmentTest->method('hasTimeLimits')
            ->willReturn(true);

        return $assessmentTest;
    }

    private function expectSection(string $sectionId, string $sectionTitle): AssessmentSection
    {
        $section = $this->createMock(AssessmentSection::class);

        $section->method('getIdentifier')
            ->willReturn($sectionId);

        $section->method('getTitle')
            ->willReturn($sectionTitle);

        return $section;
    }

    private function expectRouteItem(
        AssessmentItemRef $itemRef,
        TestPart $testPart,
        AssessmentSection $section
    ): RouteItem {
        $routeItem = $this->createMock(RouteItem::class);

        $routeItem->method('getAssessmentItemRef')
            ->willReturn($itemRef);

        $routeItem->method('getTestPart')
            ->willReturn($testPart);

        $routeItem->method('getAssessmentSection')
            ->willReturn($section);

        return $routeItem;
    }

    private function expectsRoute(array $routeItems): Route
    {
        $route = $this->createMock(Route::class);
        $route->method('getAllRouteItems')
            ->willReturn($routeItems);

        return $route;
    }
}
