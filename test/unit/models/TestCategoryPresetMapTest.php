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

namespace oat\taoQtiTestPreviewer\test\unit\models;

use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\taoQtiTest\models\TestCategoryPreset;
use oat\taoQtiTest\models\TestCategoryPresetProvider;
use oat\taoQtiTestPreviewer\models\TestCategoryPresetMap;

class TestCategoryPresetMapTest extends TestCase
{
    /** @var TestCategoryPresetProvider|MockObject */
    private $testCategoryPresetProviderMock;

    /** @var TestCategoryPreset */
    private $subject;

    /** @var TestCategoryPreset|MockObject */
    private $testCategoryPresetMock;

    public function setUp(): void
    {
        $this->testCategoryPresetProviderMock = $this->createMock(TestCategoryPresetProvider::class);
        $this->testCategoryPresetMock = $this->createMock(TestCategoryPreset::class);
        $this->subject = new TestCategoryPresetMap(
            $this->testCategoryPresetProviderMock
        );
    }

    public function testGetMap(): void
    {
        $this->testCategoryPresetProviderMock
            ->expects($this->once())
            ->method('findPresetGroupOrFail')
            ->willReturn([
                'presets' => [
                    $this->testCategoryPresetMock
                ]
            ]);

        $this->testCategoryPresetMock
            ->expects($this->once())
            ->method('getId')
            ->willReturn('presetId');

        $this->testCategoryPresetMock
            ->expects($this->once())
            ->method('getQtiCategory')
            ->willReturn('qtiCategory');

        $this->assertSame([
            ['presetId' => 'qtiCategory']
        ], $this->subject->getMap());
    }

    public function testGetMapEmpty(): void
    {
        $this->testCategoryPresetProviderMock
            ->expects($this->once())
            ->method('findPresetGroupOrFail')
            ->willReturn([
                'presets' => []
            ]);

        $this->assertSame([], $this->subject->getMap());
    }
}
