<?php

/**
 * SPDX-FileCopyrightText: 2026 Open Assessment Technologies S.A.
 * Copyright (C) 2026 (original work) Open Assessment Technologies S.A.
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-TAO-Commercial-License
 */

declare(strict_types=1);

namespace oat\taoQtiTestPreviewer\models;

use core_kernel_classes_Resource;

class SharedStimulusPreviewRegistry
{
    /** @var iterable<SharedStimulusPreviewHandlerInterface> */
    private iterable $handlers;

    public function __construct(iterable $handlers = [])
    {
        $this->handlers = $handlers;
    }

    public function buildResponse(core_kernel_classes_Resource $item, string $baseUrl): ?array
    {
        $handler = $this->findHandler($item);

        return $handler ? $handler->buildResponse($item, $baseUrl) : null;
    }

    public function loadAssetStream(core_kernel_classes_Resource $item, string $path)
    {
        $handler = $this->findHandler($item);

        return $handler ? $handler->loadAssetStream($item, $path) : null;
    }

    private function findHandler(core_kernel_classes_Resource $item): ?SharedStimulusPreviewHandlerInterface
    {
        foreach ($this->handlers as $handler) {
            if ($handler->supports($item)) {
                return $handler;
            }
        }

        return null;
    }
}
