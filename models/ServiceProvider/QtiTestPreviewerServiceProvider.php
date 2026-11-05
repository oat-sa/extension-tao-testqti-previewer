<?php

/**
 * SPDX-FileCopyrightText: 2022-2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models\ServiceProvider;

use oat\generis\model\DependencyInjection\ContainerServiceProviderInterface;
use oat\oatbox\service\ServiceManager;
use oat\taoQtiTest\models\TestCategoryPresetProvider;
use oat\taoQtiTestPreviewer\models\SharedStimulusPreviewRegistry;
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
use function Symfony\Component\DependencyInjection\Loader\Configurator\tagged_iterator;

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
            ->set(SharedStimulusPreviewRegistry::class, SharedStimulusPreviewRegistry::class)
            ->public()
            ->args(
                [
                    tagged_iterator('tao.qti_test_previewer.shared_stimulus_handler'),
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
