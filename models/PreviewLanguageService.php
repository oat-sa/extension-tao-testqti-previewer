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

namespace oat\taoQtiTestPreviewer\models;

use common_exception_Error;
use oat\generis\model\GenerisRdf;
use oat\oatbox\service\ConfigurableService;
use oat\oatbox\user\UserLanguageService;

class PreviewLanguageService extends ConfigurableService
{
    /**
     * @param string $deliveryUri
     * @param string $resultId
     * @return string
     *
     * @throws common_exception_Error
     */
    public function getPreviewLanguage($deliveryUri, $resultId)
    {
        /** @var UserLanguageService $userLanguageService */
        $userLanguageService = $this->getServiceLocator()->get(UserLanguageService::class);

        if ($userLanguageService->isDataLanguageEnabled()) {
            return $userLanguageService->getDefaultLanguage();
        }

        $ttLanguage = $this->getTestTakerInterfaceLanguage($deliveryUri, $resultId);

        return !empty($ttLanguage) ? $ttLanguage : $userLanguageService->getDefaultLanguage();
    }

    /**
     * @param string $deliveryUri
     * @param string $resultId
     * @return string|null
     *
     * @throws common_exception_Error
     */
    private function getTestTakerInterfaceLanguage($deliveryUri, $resultId)
    {
        /** @var TestTakerService $testTakerService */
        $testTakerService = $this->getServiceLocator()->get(TestTakerService::class);

        $testTaker = $testTakerService->getTestTaker($deliveryUri, $resultId);

        $languages = $testTaker->getPropertyValues(GenerisRdf::PROPERTY_USER_DEFLG);

        return !empty($languages) ? current($languages) : null;
    }
}
