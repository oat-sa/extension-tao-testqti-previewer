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

namespace oat\taoQtiTestPreviewer\models\testConfiguration;

use JsonSerializable;
use oat\taoTests\models\runner\plugins\TestPlugin;

class TestPreviewerConfig implements JsonSerializable
{
    /** @var TestPlugin[] */
    private $providers;

    /** @var array */
    private $options;

    public function __construct(array $providers, array $options)
    {
        $this->providers = $providers;
        $this->options = $options;
    }

    public function jsonSerialize()
    {
        return [
            'providers' => $this->getProviders(),
            'options' => $this->getOptions(),
        ];
    }

    public function getProviders(): array
    {
        return $this->providers;
    }

    public function getOptions(): array
    {
        return $this->options;
    }
}
