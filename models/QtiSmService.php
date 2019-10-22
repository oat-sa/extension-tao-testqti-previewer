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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA;
 */

namespace oat\taoQtiTestPreviewer\models;

use oat\oatbox\service\ConfigurableService;
use OutOfBoundsException;
use OutOfRangeException;
use qtism\common\datatypes\files\FileManagerException;
use qtism\common\datatypes\files\FileSystemFileManager;
use qtism\runtime\common\Variable;
use taoQtiCommon_helpers_PciVariableFiller;
use taoQtiCommon_helpers_Utils;

class QtiSmService extends ConfigurableService
{
    /**
     * Convert client-side data as QtiSm Runtime Variables
     * @param taoQtiCommon_helpers_PciVariableFiller $filler
     * @throws FileManagerException
     * @return Variable[]
     */
    public function getQtiSmVariables($filler, $jsonPayload)
    {
        $variables = array();

        foreach ($jsonPayload as $id => $response) {
            try {
                $var = $filler->fill($id, $response);
                // Do not take into account QTI Files at preview time.
                // Simply delete the created file.
                if (taoQtiCommon_helpers_Utils::isQtiFile($var, false) === true) {
                    $fileManager = new FileSystemFileManager();
                    $fileManager->delete($var->getValue());
                }
                else {
                    $variables[] = $var;
                }
            }
            catch (OutOfRangeException $e) {
                // A variable value could not be converted, ignore it.
                // Developer's note: QTI Pairs with a single identifier (missing second identifier of the pair) are transmitted as an array of length 1,
                // this might cause problem. Such "broken" pairs are simply ignored.
                $this->logDebug("Client-side value for variable '${id}' is ignored due to data malformation.");
            }
            catch (OutOfBoundsException $e) {
                // No such identifier found in item.
                $this->logDebug("The variable with identifier '${id}' is not declared in the item definition.");
            }
        }

        return $variables;
    }
}
