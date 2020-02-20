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
use oat\oatbox\service\ConfigurableService;
use oat\oatbox\user\User;
use oat\oatbox\user\UserLanguageService;
use oat\taoResultServer\models\classes\implementation\ResultServerService;
use tao_models_classes_UserService;

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

        return $userLanguageService->getDataLanguage($this->findTestTaker($deliveryUri, $resultId));
    }

    /**
     * @param $deliveryUri
     * @param $resultId
     * @return User
     *
     * @throws common_exception_Error
     */
    private function findTestTaker($deliveryUri, $resultId)
    {
        /** @var ResultServerService $resultServerService */
        $resultServerService = $this->getServiceLocator()->get(ResultServerService::SERVICE_ID);

        $resultStorage = $resultServerService->getResultStorage($deliveryUri);

        $userId = $resultStorage->getTestTaker($resultId);

        /** @var tao_models_classes_UserService $userService */
        $userService = $this->getServiceLocator()->get(tao_models_classes_UserService::SERVICE_ID);

        return $userService->getUserById($userId);
    }
}
