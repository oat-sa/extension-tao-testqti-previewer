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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\test\unit\models\test\service;

use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\test\factory\TestPreviewRouteFactory;
use qtism\data\AssessmentTest;
use qtism\runtime\tests\Route;

class TestPreviewRouteFactoryTest extends TestCase
{
    /** @var TestPreviewRouteFactory */
    private $subject;

    protected function setUp(): void
    {
        $this->subject = new TestPreviewRouteFactory();
    }

    public function testCreate(): void
    {
        $assessmentTest = $this->createMock(AssessmentTest::class);
        $assessmentTest->method('getTestParts')
            ->willReturn([]);

        $this->assertInstanceOf(Route::class, $this->subject->create($assessmentTest));
    }
}
