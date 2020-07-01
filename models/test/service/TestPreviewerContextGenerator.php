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
use oat\taoQtiTest\models\runner\config\QtiRunnerConfig;
use oat\taoQtiTest\models\TestSessionService;
use oat\taoQtiTestPreviewer\models\test\context\TestPreviewContext;
use oat\taoQtiTestPreviewer\models\test\TestPreviewRequest;

class TestPreviewerContextGenerator extends ConfigurableService implements TestPreviewerContextGeneratorInterface
{
    public function generate(TestPreviewRequest $testPreviewRequest): TestPreviewContext
    {
        $testConfig = $this->getQtiRunnerConfig();

        $assessmentTest = $this->getTestPreviewerAssessmentTestGenerator()->generate($testPreviewRequest);

        $serviceContext = new TestPreviewContext($assessmentTest);
        $serviceContext->setServiceManager($this->getServiceManager());
        $serviceContext->setTestConfig($testConfig);

        $testSession = $serviceContext->getTestSession();
        $testSession->beginTestSession();

        $serviceContext->setTestSession($testSession);

        $this->getTestSessionService()->registerTestSession(
            $testSession,
            $serviceContext->getStorage(),
            $serviceContext->getCompilationDirectory()
        );

        return $serviceContext;
    }

    private function getTestPreviewerAssessmentTestGenerator(): TestPreviewerAssessmentTestGeneratorInterface
    {
        return $this->getServiceLocator()->get(TestPreviewerAssessmentTestGenerator::class);
    }

    private function getQtiRunnerConfig(): QtiRunnerConfig
    {
        return $this->getServiceManager()->get(QtiRunnerConfig::SERVICE_ID);
    }

    private function getTestSessionService(): TestSessionService
    {
        return $this->getServiceManager()->get(TestSessionService::SERVICE_ID);
    }
}
