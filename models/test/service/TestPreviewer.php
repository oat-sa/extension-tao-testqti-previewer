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

namespace oat\taoQtiTestPreviewer\models\test\service;

use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapper;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactoryInterface;
use oat\taoQtiTestPreviewer\models\test\TestPreview;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;
use qtism\data\storage\xml\XmlStorageException;

class TestPreviewer implements TestPreviewerInterface
{
    private TestPreviewRouteFactoryInterface $routeFactory;
    private TestPreviewerAssessmentTestGenerator $generator;
    private TestPreviewMapper $mapper;
    private TestPreviewTimerBuilderInterface $timerBuilder;

    public function __construct(
        TestPreviewRouteFactoryInterface $routeFactory,
        TestPreviewerAssessmentTestGenerator $generator,
        TestPreviewMapper $mapper,
        TestPreviewTimerBuilderInterface $timerBuilder
    )
    {
        $this->routeFactory = $routeFactory;
        $this->generator = $generator;
        $this->mapper = $mapper;
        $this->timerBuilder = $timerBuilder;
    }

    /**
     * @param TestPreviewRequest $testPreviewRequest
     * @return TestPreview
     * @throws XmlStorageException
     */
    public function createPreview(TestPreviewRequest $testPreviewRequest): TestPreview
    {
        $testAssessment = $this->generator->generate($testPreviewRequest);
        $route = $this->routeFactory->create($testAssessment);

        return new TestPreview(
            $this->mapper->map($testAssessment, $route, $testPreviewRequest->getConfig()),
            $this->timerBuilder->build($testAssessment, $route)
        );
    }
}
