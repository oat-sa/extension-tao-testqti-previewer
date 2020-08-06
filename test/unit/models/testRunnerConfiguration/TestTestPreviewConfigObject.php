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

namespace unit\models\testRunnerConfiguration;

use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\testRunnerConfiguration\TestPreviewerConfigObject;

class TestTestPreviewConfigObject extends TestCase
{

    /**
     * @var TestPreviewerConfigObject
     */
    private $subject;

    private const providers = ['a' => 'b'];
    private const options = ['c' => 'd'];

    public function setUp(): void
    {
        $this->subject = new TestPreviewerConfigObject(self::providers, self::options);
    }

    public function testGetConfig()
    {
        $this->assertEquals($this->subject->getOptions(), self::options);
        $this->assertEquals($this->subject->getProviders(), self::providers);
        $this->assertEquals(json_encode($this->subject), $this->getSerilizedObject());
    }

    private function getSerilizedObject()
    {
        return json_encode(['providers' => self::providers, 'options' => self::options]);
    }
}
