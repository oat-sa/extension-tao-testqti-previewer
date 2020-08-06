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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA
 */

declare(strict_types=1);

namespace unit\models\testRunnerConfiguration;

use oat\generis\test\TestCase;
use oat\taoQtiTest\models\runner\config\QtiRunnerConfig;
use oat\taoQtiTestPreviewer\models\testRunnerConfiguration\TestPreviewerConfigObject;
use oat\taoQtiTestPreviewer\models\testRunnerConfiguration\TestPreviewerConfigurationService;
use oat\taoTests\models\runner\plugins\TestPluginService;
use oat\taoTests\models\runner\providers\TestProviderService;

class TestPreviewerConfigurationServiceTest extends TestCase
{

    /**
     * @var TestPreviewerConfigurationService
     */
    private $subject;

    private const providers = ['a' => 'b'];
    private const options = ['c' => 'd'];
    /**
     * @var TestPluginService|\PHPUnit\Framework\MockObject\MockObject
     */
    private $testPluginService;
    /**
     * @var QtiRunnerConfig|\PHPUnit\Framework\MockObject\MockObject
     */
    private $qtiRunnerConfig;
    /**
     * @var TestProviderService|\PHPUnit\Framework\MockObject\MockObject
     */
    private $testProviderService;


    public function setUp(): void
    {
        $this->testProviderService = $this->createMock(TestProviderService::class);
        $this->testPluginService = $this->createMock(TestPluginService::class);
        $this->qtiRunnerConfig = $this->createMock(QtiRunnerConfig::class);

        $this->subject = new TestPreviewerConfigurationService();

        $slm = $this->getServiceLocatorMock(
            [
                TestPluginService::SERVICE_ID => $this->testPluginService,
                TestProviderService::SERVICE_ID => $this->testProviderService,
                QtiRunnerConfig::SERVICE_ID => $this->qtiRunnerConfig,
            ]
        );

        $this->subject->setServiceLocator($slm);
    }

    public function testGetTestRunnerConfiguration(): void
    {
        $configurationSample = new TestPreviewerConfigObject(self::providers, self::options);
        $this->assertEquals($this->subject->getTestRunnerConfiguration(), $configurationSample);
    }
}
