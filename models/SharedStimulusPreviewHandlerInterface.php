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

interface SharedStimulusPreviewHandlerInterface
{
    public function supports(core_kernel_classes_Resource $item): bool;

    public function buildResponse(core_kernel_classes_Resource $item, string $baseUrl): array;

    public function loadAssetStream(core_kernel_classes_Resource $item, string $path);
}
