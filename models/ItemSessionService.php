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
use qtism\data\storage\xml\XmlDocument;
use qtism\runtime\common\State;
use qtism\runtime\common\Variable;
use qtism\runtime\tests\AssessmentItemSession;
use qtism\runtime\tests\AssessmentItemSessionException;
use qtism\runtime\tests\SessionManager;
use \RuntimeException;
use taoQtiCommon_helpers_ResultTransmissionException;

/**
 * Class ItemSessionService
 * Manage item session, validate response
 */
class ItemSessionService extends ConfigurableService
{
    /**
     * @param XmlDocument $qtiXmlDoc
     * @param Variable[] $variables
     * @return AssessmentItemSession
     */
    public function getItemSession($qtiXmlDoc, $variables)
    {
        $itemSession = $this->getItemSessionSubject($qtiXmlDoc);

        try {
            $itemSession->beginAttempt();
            $itemSession->endAttempt(new State($variables));
        } catch (AssessmentItemSessionException $e) {
            $msg = 'An error occurred while processing the responses.';
            throw new RuntimeException($msg, 0, $e);
        } catch (taoQtiCommon_helpers_ResultTransmissionException $e) {
            $msg = 'An error occurred while transmitting a result to the target Result Server.';
            throw new RuntimeException($msg, 0, $e);
        }

        return $itemSession;
    }

    /**
     * @param XmlDocument $qtiXmlDoc
     * @return AssessmentItemSession
     */
    private function getItemSessionSubject($qtiXmlDoc)
    {
        $sessionManager = new SessionManager();
        $itemSession = new AssessmentItemSession($qtiXmlDoc->getDocumentComponent(), $sessionManager);
        $itemSession->beginItemSession();

        return $itemSession;
    }
}
