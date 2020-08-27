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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *               
 * 
 */

 // !!!TODO - should be to rely on the taoTest extension 
 // to supply the API to manage the provider registration and management instead of directly write into the registry
namespace oat\taoQtiTestPreviewer\scripts\install;

use oat\oatbox\extension\InstallAction;
use oat\tao\model\ClientLibConfigRegistry;

/**
 * Class RegisterTestPreviewer
 * @package oat\taoQtiTestPreviewer\scripts\install
 */
class RegisterTestPreviewer extends InstallAction
{
    /**
     * Sets the test previewer.
     *
     * @param $params
     *
     * @return \common_report_Report
     */
    public function __invoke($params)
    {
        ClientLibConfigRegistry::getRegistry()->register(
            'taoTests/previewer/factory', array(
                'previewers' => array(
                    'taoQtiTestPreviewer/previewer/adapter/test/qtiTest' => array(
                        'id' => 'qtiTest',
                        'module' => 'taoQtiTestPreviewer/previewer/adapter/test/qtiTest',
                        'bundle' => 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                        'position' => null,
                        'name' => 'QTI Test Previewer',
                        'description' => 'QTI implementation of the test previewer',
                        'category' => 'previewer',
                        'active' => true,
                        'tags' => array(
                            'core',
                            'qti',
                            'previewer'
                        )
                    )
                )
            )
        );

        return new \common_report_Report(\common_report_Report::TYPE_SUCCESS, 'The QTI Test Previewer is registered');
    }
}