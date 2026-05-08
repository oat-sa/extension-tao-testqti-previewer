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
 * Copyright (c) 2022 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models\ServiceProvider;

use oat\generis\model\DependencyInjection\ContainerServiceProviderInterface;
use oat\oatbox\service\ServiceManager;
use oat\taoQtiTest\models\TestCategoryPresetProvider;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactory;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactoryInterface;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapper;
use oat\taoQtiTestPreviewer\models\test\mapper\TestPreviewMapperInterface;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewer;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewerAssessmentTestGenerator;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewerAssessmentTestGeneratorInterface;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewerInterface;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewTimerBuilder;
use oat\taoQtiTestPreviewer\models\test\service\TestPreviewTimerBuilderInterface;
use oat\taoQtiTestPreviewer\models\TestCategoryPresetMap;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

class QtiTestPreviewerServiceProvider implements ContainerServiceProviderInterface
{
    public function __invoke(ContainerConfigurator $configurator): void
    {
        $services = $configurator->services();

        $services
            ->set(TestCategoryPresetMap::class, TestCategoryPresetMap::class)
            ->public()
            ->args(
                [
                    service(TestCategoryPresetProvider::SERVICE_ID),
                ]
            );

        $services
            ->set(TestPreviewRouteFactoryInterface::class, TestPreviewRouteFactory::class);
        $services
            ->set(TestPreviewerAssessmentTestGeneratorInterface::class, TestPreviewerAssessmentTestGenerator::class)
            ->call('setServiceManager', [service(ServiceManager::class)]);
        $services
            ->set(TestPreviewMapperInterface::class, TestPreviewMapper::class)
            ->call('setServiceManager', [service(ServiceManager::class)]);
        $services
            ->set(TestPreviewTimerBuilderInterface::class, TestPreviewTimerBuilder::class);
        $services
            ->set(TestPreviewerInterface::class, TestPreviewer::class)
            ->public()
            ->args(
                [
                    service(TestPreviewRouteFactoryInterface::class),
                    service(TestPreviewerAssessmentTestGeneratorInterface::class),
                    service(TestPreviewMapperInterface::class),
                    service(TestPreviewTimerBuilderInterface::class),
                ]
            );
    }
}
