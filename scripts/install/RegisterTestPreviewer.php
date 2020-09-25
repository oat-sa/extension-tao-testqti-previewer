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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\scripts\install;

use common_Exception as Exception;
use common_report_Report as Report;
use oat\oatbox\extension\InstallAction;
use oat\tao\model\modules\DynamicModule;
use common_exception_InconsistentData as InconsistentData;
use oat\oatbox\service\exception\InvalidServiceManagerException;
use oat\taoTests\models\preview\TestPreviewerRegistryServiceInterface;

/**
 * Class RegisterTestPreviewer
 *
 * @package oat\taoQtiTestPreviewer\scripts\install
 */
class RegisterTestPreviewer extends InstallAction
{
    /**
     * @param array $params
     *
     * @throws InconsistentData
     * @throws InvalidServiceManagerException
     * @throws Exception
     *
     * @return Report
     */
    public function __invoke($params)
    {
        /** @var TestPreviewerRegistryServiceInterface $testPreviewerService */
        $testPreviewerService = $this->getServiceManager()->get(
            TestPreviewerRegistryServiceInterface::SERVICE_ID
        );
        $testPreviewerService->registerAdapter(DynamicModule::fromArray([
            'id' => 'qtiTest',
            'module' => 'taoQtiTestPreviewer/previewer/adapter/test/qtiTest',
            'bundle' => 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            'position' => null,
            'name' => 'QTI Test Previewer',
            'description' => 'QTI implementation of the test previewer',
            'category' => 'previewer',
            'active' => true,
            'tags' => [
                'core',
                'qti',
                'previewer',
            ],
        ]));

        return Report::createSuccess('The QTI Test Previewer is registered');
    }
}
