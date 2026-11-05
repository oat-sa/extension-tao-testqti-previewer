<?php

/**
 * SPDX-FileCopyrightText: 2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\test\unit\controller;

use oat\taoQtiTestPreviewer\controller\Previewer;
use RuntimeException;

class PreviewerProxy extends Previewer
{
    public array $jsonCalls = [];

    public array $resources = [];

    public ?object $session = null;

    public ?array $itemResponse = null;

    protected function returnJson($data, $httpStatus = 200)
    {
        $this->jsonCalls[] = [
            'data' => $data,
            'status' => $httpStatus,
        ];
    }

    protected function getSession()
    {
        return $this->session;
    }

    public function getResource($uri)
    {
        if (!array_key_exists($uri, $this->resources)) {
            throw new RuntimeException(sprintf('Resource "%s" not configured in test.', $uri));
        }

        return $this->resources[$uri];
    }

    protected function createItemResponse(\core_kernel_classes_Resource $item, string $lang): array
    {
        if ($this->itemResponse === null) {
            throw new RuntimeException('Item response not configured in test.');
        }

        return $this->itemResponse;
    }
}
