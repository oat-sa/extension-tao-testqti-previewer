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
use oat\taoQtiTest\models\runner\QtiRunnerService;
use oat\taoQtiTestPreviewer\models\test\TestPreview;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;

class TestPreviewer extends ConfigurableService implements TestPreviewerInterface
{
    /**
     * @inheritDoc
     */
    public function createPreview(TestPreviewRequest $testPreviewRequest): TestPreview
    {
        $runnerService = $this->getRunnerService()->mapAsTestPreview();
        $runnerService->getQtiRunnerMap()->mapAsTestPreview();

        $serviceContext = $this->getTestPreviewerContextGenerator()->generate($testPreviewRequest);

        return new TestPreview(
            $runnerService->getTestData($serviceContext),
            $runnerService->getTestContext($serviceContext),
            $runnerService->getTestMap($serviceContext)
        );
    }

    private function getRunnerService(): QtiRunnerService
    {
        return $this->getServiceLocator()->get(QtiRunnerService::SERVICE_ID);
    }

    private function getTestPreviewerContextGenerator(): TestPreviewerContextGeneratorInterface
    {
        return $this->getServiceManager()->get(TestPreviewerContextGenerator::class);
    }
}
