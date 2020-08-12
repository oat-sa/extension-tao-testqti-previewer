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

namespace oat\taoQtiTestPreviewer\models\testConfiguration\mapper;

use oat\oatbox\service\ConfigurableService;
use oat\tao\model\plugins\PluginModule;
use oat\tao\model\providers\ProviderModule;
use oat\taoQtiTestPreviewer\models\testConfiguration\TestPreviewerConfig;
use oat\taoTests\models\runner\plugins\TestPlugin;

class TestPreviewerConfigurationMapper extends ConfigurableService
{
    /**
     * @param ProviderModule[] $providerModules
     * @param PluginModule[] $plugins
     * @param mixed[] $options
     *
     * @return TestPreviewerConfig
     */
    public function map(array $providerModules, array $plugins, array $options): TestPreviewerConfig
    {
        return new TestPreviewerConfig($this->getActiveProviders($providerModules, $plugins), $options);
    }

    /**
     * @param ProviderModule[] $providerModules
     * @param PluginModule[] $plugins
     *
     * @return TestPlugin[]
     */
    private function getActiveProviders(array $providerModules, array $plugins): array
    {
        $providers = [];

        foreach ($providerModules as $provider) {
            if ($provider->isActive()) {
                $category = $provider->getCategory();

                if (!isset($providers[$category])) {
                    $providers[$category] = [];
                }

                $providers[$category][] = $provider;
            }
        }

        $plugins = $this->getActivePlugins($plugins);

        $providers['plugins'] = array_values($plugins);

        return $providers;
    }

    /**
     * @param PluginModule[] $plugins
     *
     * @return TestPlugin[]
     */
    private function getActivePlugins(array $plugins): array
    {
        $result = [];

        foreach ($plugins as $key => $plugin) {
            if ($plugin instanceof TestPlugin && $plugin->isActive()) {
                $result[$key] = $plugin;
            }
        }

        return $result;
    }
}
