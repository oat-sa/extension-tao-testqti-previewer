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
use taoQtiCommon_helpers_PciVariableFiller as PciVariableFiller;
use taoQtiCommon_helpers_Utils;

class QtiSmService extends ConfigurableService
{
    /**
     * Convert client-side data as QtiSm Runtime Variables
     * @param PciVariableFiller $filler
     * @param array $jsonPayload
     * @return Variable[]
     * @throws FileManagerException
     */
    public function getQtiSmVariables($filler, $jsonPayload)
    {
        $variables = [];

        foreach ($jsonPayload as $id => $response) {
            try {
                $var = $filler->fill($id, $response);
                // Do not take into account QTI Files at preview time. Simply delete the created file.
                if (taoQtiCommon_helpers_Utils::isQtiFile($var, false) === true) {
                    $fileManager = new FileSystemFileManager();
                    $fileManager->delete($var->getValue());
                } else {
                    $variables[] = $var;
                }
            } catch (OutOfRangeException $e) {
                // Variable value could not be converted, ignore it.
                $this->logDebug(
                    sprintf('Client-side value for variable "%s" is ignored due to data malformation.', $id)
                );
            } catch (OutOfBoundsException $e) {
                $this->logDebug(
                    sprintf('The variable with identifier "%s" is not declared in the item definition.', $id)
                );
            }
        }

        return $variables;
    }
}
