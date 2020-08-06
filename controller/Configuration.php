<?php

declare(strict_types=1);

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

namespace oat\taoQtiTestPreviewer\controller;

use Context;
use oat\taoQtiTestPreviewer\models\testRunnerConfiguration\TestPreviewerConfigurationService;
use tao_actions_ServiceModule;

use function GuzzleHttp\Psr7\stream_for;

class Configuration extends tao_actions_ServiceModule
{

    public function getPreviewConfig(): void
    {
        $testPreviewerConfiguration = $this->getTestPreviewerConfigurationService()->getTestRunnerConfiguration();

        Context::getInstance()->getResponse()->setContentHeader('application/json');
        $this->response = $this->getPsrResponse()->withBody(stream_for(json_encode($testPreviewerConfiguration)));
    }

    private function getTestPreviewerConfigurationService(): TestPreviewerConfigurationService
    {
        return $this->getServiceLocator()->get(TestPreviewerConfigurationService::class);
    }

}
