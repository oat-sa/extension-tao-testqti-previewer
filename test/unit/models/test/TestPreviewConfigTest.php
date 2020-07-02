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

namespace oat\taoQtiTestPreviewer\test\unit\models\test;

use oat\generis\test\TestCase;
use oat\taoQtiTestPreviewer\models\test\TestPreview;
use oat\taoQtiTestPreviewer\models\test\TestPreviewConfig;

class TestPreviewConfigTest extends TestCase
{
    /** @var TestPreview */
    private $subject;

    protected function setUp(): void
    {
        $this->subject = new TestPreviewConfig(
            [
                TestPreviewConfig::CHECK_INFORMATIONAL => true,
                TestPreviewConfig::REVIEW_DISPLAY_SUBSECTION_TITLE => true,
                TestPreviewConfig::REVIEW_FORCE_INFORMATION_TITLE => true,
            ]
        );
    }

    public function testConstruct(): void
    {
        $this->assertTrue($this->subject->get(TestPreviewConfig::CHECK_INFORMATIONAL));
        $this->assertTrue($this->subject->get(TestPreviewConfig::REVIEW_DISPLAY_SUBSECTION_TITLE));
        $this->assertTrue($this->subject->get(TestPreviewConfig::REVIEW_FORCE_INFORMATION_TITLE));
        $this->assertNull($this->subject->get('doesNotExist'));
    }
}
