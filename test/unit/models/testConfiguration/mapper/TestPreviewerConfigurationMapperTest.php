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

namespace unit\models\testConfiguration\mapper;

use oat\generis\test\TestCase;
use oat\tao\model\providers\ProviderModule;
use oat\taoQtiTestPreviewer\models\testConfiguration\mapper\TestPreviewerConfigurationMapper;
use oat\taoQtiTestPreviewer\models\testConfiguration\TestPreviewerConfig;
use oat\taoTests\models\runner\plugins\TestPlugin;

class TestPreviewerConfigurationMapperTest extends TestCase
{
    /** @var TestPreviewerConfigurationMapper */
    private $subject;

    protected function setUp(): void
    {
        $this->subject = new TestPreviewerConfigurationMapper();
    }

    public function testMap(): void
    {
        $ref = new TestPreviewerConfig(
            [
                'category' => $this->getProviders(),
                'plugins' => $this->getPlugins()
            ],
            $this->getConfig()
        );
        $this->assertEquals($ref, $this->subject->map($this->getProviders(), $this->getPlugins(), $this->getConfig()));
    }

    private function getPlugins(): array
    {
        return [
            new TestPlugin('id1', 'module', 'category', ['active' => true]),
            new TestPlugin('id2', 'module', 'category', ['active' => true]),
        ];
    }

    private function getProviders(): array
    {
        return [
            new ProviderModule('idp1', 'module', 'category', ['active' => true]),
            new ProviderModule('idp2', 'module', 'category', ['active' => true]),
        ];
    }

    private function getConfig(): array
    {
        return ['exitButton' => false];
    }
}
