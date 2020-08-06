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

namespace oat\taoQtiTestPreviewer\models\testRunnerConfiguration;

use oat\oatbox\service\ConfigurableService;
use oat\tao\model\plugins\PluginModule;
use oat\taoQtiTest\models\runner\config\QtiRunnerConfig;
use oat\taoTests\models\runner\plugins\TestPlugin;
use oat\taoTests\models\runner\plugins\TestPluginService;
use oat\taoTests\models\runner\providers\TestProviderService;

class TestPreviewerConfigurationService extends ConfigurableService
{
    public function getTestRunnerConfiguration(): TestPreviewerConfigObject
    {
        $providers = $this->getTestRunnerActiveProviders();

        $options = $this->getTestRunnerOptions();

        return new TestPreviewerConfigObject($providers, $options);
    }

    /**
     * @return TestPluginService[]
     */
    private function getTestRunnerActivePlugins(): array
    {
        $result = [];

        foreach ($this->getTestRunnerPluginService()->getAllPlugins() as $key => $plugin) {
            if ($plugin instanceof TestPlugin && $plugin->isActive()) {
                $result[$key] = $plugin;
            }
        }

        return $result;
    }

    /**
     * @return PluginModule[]
     */
    private function getTestRunnerActiveProviders(): array
    {
        $providers = [];
        foreach ($this->getProviderService()->getAllProviders() as $provider) {
            if ($provider->isActive()) {
                $category = $provider->getCategory();
                if (!isset($providers[$category])) {
                    $providers[$category] = [];
                }
                $providers[$category][] = $provider;
            }
        }

        $plugins = $this->getTestRunnerActivePlugins();
        $providers['plugins'] = array_values($plugins);

        return $providers;
    }

    private function getTestRunnerOptions(): array
    {
        return $this->getTestRunnerConfigurationService()->getConfig();
    }

    private function getProviderService(): TestProviderService
    {
        return $this->getServiceManager()->get(TestProviderService::SERVICE_ID);
    }

    private function getTestRunnerPluginService(): TestPluginService
    {
        return $this->getServiceLocator()->get(TestPluginService::SERVICE_ID);
    }

    private function getTestRunnerConfigurationService(): QtiRunnerConfig
    {
        return $this->getServiceManager()->get(QtiRunnerConfig::SERVICE_ID);
    }
}
