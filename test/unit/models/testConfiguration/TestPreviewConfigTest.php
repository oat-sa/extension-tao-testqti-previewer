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

namespace unit\models\testConfiguration;

use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\testConfiguration\TestPreviewerConfig;

class TestPreviewConfigTest extends TestCase
{
    private const PROVIDERS = ['a' => 'b'];
    private const OPTIONS = ['c' => 'd'];

    /**
     * @var TestPreviewerConfig
     */
    private $subject;

    public function setUp(): void
    {
        $this->subject = new TestPreviewerConfig(self::PROVIDERS, self::OPTIONS);
    }

    public function testGetConfig(): void
    {
        $this->assertEquals(self::OPTIONS, $this->subject->getOptions());
        $this->assertEquals(self::PROVIDERS, $this->subject->getProviders());
        $this->assertEquals($this->getSerializedObject(), json_encode($this->subject));
    }

    private function getSerializedObject(): string
    {
        return json_encode(['providers' => self::PROVIDERS, 'options' => self::OPTIONS]);
    }
}
