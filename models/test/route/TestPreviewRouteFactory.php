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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

namespace oat\taoQtiTestPreviewer\models\test\route;

use oat\oatbox\service\ConfigurableService;
use qtism\data\AssessmentTest;
use qtism\runtime\tests\Route;
use qtism\runtime\tests\SessionManager;

class TestPreviewRouteFactory extends ConfigurableService implements TestPreviewRouteFactoryInterface
{
    public function createRoute(AssessmentTest $test): Route
    {
        $manager = new class() extends SessionManager {
            public function createRoute(AssessmentTest $test)
            {
                return parent::createRoute($test);
            }
        };

        return $manager->createRoute($test);
    }
}
