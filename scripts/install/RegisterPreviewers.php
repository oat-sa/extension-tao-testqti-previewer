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
 * Copyright (c) 2018-2020 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\scripts\install;

use common_Exception as Exception;
use common_exception_InconsistentData as InconsistentDataException;
use common_report_Report as Report;
use oat\oatbox\extension\InstallAction;
use oat\oatbox\service\exception\InvalidServiceManagerException;
use oat\tao\model\modules\DynamicModule;
use oat\taoItems\model\preview\ItemPreviewerRegistryServiceInterface;
use oat\taoQtiTest\models\DeliveryItemTypeService;

/**
 * Installation action that registers the test runner providers
 *
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
class RegisterPreviewers extends InstallAction
{
    private const PROVIDERS = [
        'previewer' => [
            [
                'id' => 'qtiItem',
                'name' => 'QTI Item Previewer',
                'module' => 'taoQtiTestPreviewer/previewer/adapter/item/qtiItem',
                'bundle' => 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'description' => 'QTI implementation of the item previewer',
                'category' => 'previewer',
                'active' => true,
                'tags' => ['core', 'qti', 'previewer'],
            ],
        ],
    ];

    /**
     * @param array $params
     *
     * @throws Exception
     * @throws InconsistentDataException
     * @throws InvalidServiceManagerException
     *
     * @return Report
     */
    public function __invoke($params)
    {
        $serviceManager = $this->getServiceManager();

        /** @var ItemPreviewerRegistryServiceInterface $registry */
        $registry = $serviceManager->get(ItemPreviewerRegistryServiceInterface::SERVICE_ID);

        $count = 0;

        foreach (self::PROVIDERS as $categoryProviders) {
            foreach ($categoryProviders as $providerData) {
                if ($registry->registerAdapter(DynamicModule::fromArray($providerData))) {
                    ++$count;
                }
            }
        }

        /** @var DeliveryItemTypeService $service */
        $service = $serviceManager->get(DeliveryItemTypeService::SERVICE_ID);
        $service->setDefaultItemType('qtiItem');
        $serviceManager->register(DeliveryItemTypeService::SERVICE_ID, $service);

        return Report::createSuccess($count . ' providers registered.');
    }
}
