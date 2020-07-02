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

namespace oat\taoQtiTestPreviewer\models\test\service;

use oat\oatbox\service\ConfigurableService;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapper;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapperInterface;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactory;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactoryInterface;
use oat\taoQtiTestPreviewer\models\test\TestPreview;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;

class TestPreviewer extends ConfigurableService implements TestPreviewerInterface
{
    /**
     * @inheritDoc
     */
    public function createPreview(TestPreviewRequest $testPreviewRequest): TestPreview
    {
        $testAssessment = $this->getAssessmentTestGenerator()->generate($testPreviewRequest);
        $route = $this->getRouteFactory()->create($testAssessment);

        return new TestPreview(
            $this->getMapper()->map($testAssessment, $route, $testPreviewRequest->getConfig())
        );
    }

    private function getAssessmentTestGenerator(): TestPreviewerAssessmentTestGeneratorInterface
    {
        return $this->getServiceLocator()->get(TestPreviewerAssessmentTestGenerator::class);
    }

    private function getRouteFactory(): TestPreviewRouteFactoryInterface
    {
        return $this->getServiceLocator()->get(TestPreviewRouteFactory::class);
    }

    private function getMapper(): TestPreviewMapperInterface
    {
        return $this->getServiceLocator()->get(TestPreviewMapper::class);
    }
}
