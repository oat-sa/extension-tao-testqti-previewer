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

namespace oat\taoQtiTestPreviewer\models\test;

class TestPreview
{
    /** @var array */
    private $testData;

    /** @var array */
    private $testContext;

    /** @var array */
    private $testMap;

    public function __construct(array $testData, array $testContext, array $testMap)
    {
        $this->testData = $testData;
        $this->testContext = $testContext;
        $this->testMap = $testMap;
    }

    public function getTestData(): array
    {
        return $this->testData;
    }

    public function getTestContext(): array
    {
        return $this->testContext;
    }

    public function getTestMap(): array
    {
        return $this->testMap;
    }
}
