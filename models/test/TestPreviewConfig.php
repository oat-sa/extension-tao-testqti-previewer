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

class TestPreviewConfig
{
    public const REVIEW_FORCE_INFORMATION_TITLE = 'review.forceInformationalTitle';
    public const REVIEW_DISPLAY_SUBSECTION_TITLE = 'review.displaySubsectionTitle';
    public const CHECK_INFORMATIONAL = 'checkInformational';

    /** @var array */
    private $config;

    public function __construct(array $config = [])
    {
        $this->config = $config;
    }

    /**
     * @return mixed|null
     */
    public function get(string $config)
    {
        return array_key_exists($config, $this->config) ? $this->config[$config] : null;
    }
}
