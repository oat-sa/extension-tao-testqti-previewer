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

namespace oat\taoQtiTestPreviewer\test\unit\models\test\service;

use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactory;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactoryInterface;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapper;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapperInterface;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewer;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewerAssessmentTestGenerator;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewerAssessmentTestGeneratorInterface;
use oat\taoQtiTestPreviewer\models\test\TestPreview;
use oat\taoQtiTestPreviewer\models\test\TestPreviewMap;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;
use qtism\data\AssessmentTest;
use qtism\runtime\tests\Route;

class TestPreviewerTest extends TestCase
{
    /** @var TestPreviewMapperInterface|MockObject */
    private $mapper;

    /** @var TestPreviewerAssessmentTestGeneratorInterface|MockObject */
    private $generator;

    /** @var TestPreviewRouteFactoryInterface|MockObject */
    private $factory;

    /** @var TestPreviewer */
    private $subject;

    protected function setUp(): void
    {
        $this->generator = $this->createMock(TestPreviewerAssessmentTestGeneratorInterface::class);
        $this->factory = $this->createMock(TestPreviewRouteFactoryInterface::class);
        $this->mapper = $this->createMock(TestPreviewMapperInterface::class);

        $this->subject = new TestPreviewer();
        $this->subject->setServiceLocator(
            $this->getServiceLocatorMock(
                [
                    TestPreviewMapper::class => $this->mapper,
                    TestPreviewerAssessmentTestGenerator::class => $this->generator,
                    TestPreviewRouteFactory::class => $this->factory,
                ]
            )
        );
    }

    public function testPreview(): void
    {
        $assessmentTest = $this->createMock(AssessmentTest::class);
        $route = $this->createMock(Route::class);

        $this->mapper
            ->method('map')
            ->willReturn(new TestPreviewMap([]));

        $this->generator
            ->method('generate')
            ->willReturn($assessmentTest);

        $this->factory
            ->method('create')
            ->willReturn($route);

        $this->assertEquals(
            new TestPreview(new TestPreviewMap([])),
            $this->subject->createPreview(new TestPreviewRequest('uri'))
        );
    }
}
