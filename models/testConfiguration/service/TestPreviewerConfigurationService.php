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

namespace oat\taoQtiTestPreviewer\models\testConfiguration\service;

use oat\oatbox\service\ConfigurableService;
use oat\taoQtiTest\models\runner\config\QtiRunnerConfig;
use oat\taoQtiTestPreviewer\models\testConfiguration\mapper\TestPreviewerConfigurationMapper;
use oat\taoQtiTestPreviewer\models\testConfiguration\TestPreviewerConfig;
use oat\taoTests\models\runner\plugins\TestPluginService;
use oat\taoTests\models\runner\providers\TestProviderService;

class TestPreviewerConfigurationService extends ConfigurableService
{
    public function getConfiguration(): TestPreviewerConfig
    {
        return $this->getMapper()->map(
            $this->getProviderService()->getAllProviders(),
            $this->getTestRunnerPluginService()->getAllPlugins(),
            $this->getTestRunnerConfigurationService()->getConfig()
        );
    }

    private function getProviderService(): TestProviderService
    {
        return $this->getServiceLocator()->get(TestProviderService::SERVICE_ID);
    }

    private function getTestRunnerPluginService(): TestPluginService
    {
        return $this->getServiceLocator()->get(TestPluginService::SERVICE_ID);
    }

    private function getTestRunnerConfigurationService(): QtiRunnerConfig
    {
        return $this->getServiceLocator()->get(QtiRunnerConfig::SERVICE_ID);
    }

    private function getMapper(): TestPreviewerConfigurationMapper
    {
        return $this->getServiceLocator()->get(TestPreviewerConfigurationMapper::class);
    }
}
