---
title: Symbolic - Operations Runner
date: '2008-07-23T22:00:00+00:00'
slug: symbolic-operations-runner
---



Symbolic engine, or OperationRunner, is something like what we have seen for the scripts: a couple of job/thread that going in polling over database, look for ready operation, or completed (success/failed) operations.<br />All this operation will be completely asynchronous both for user and symbolic application: a ControllerJob will call each "n" seconds to verify the state of ran operation.<br /><br /><br /><a onblur="try {parent.deselectBloggerImageGracefully();} catch(e) {}" href="http://2.bp.blogspot.com/_mcrRJdyp-jg/SIgpF41wQ2I/AAAAAAAAEdc/vvT8xvP57H8/s1600-h/OperationRunner.png">![](/images/symbolic-operations-runner/00-OperationRunner.png)</a><br /><ol><li>Select machine(s), decide which operation he want, and complete (if required) the parameters needed for the execution</li><li>An entry is stored in database and set in "ready state"</li><li>RunnerJob (is not the same job used to run scripts!) check, each "x" seconds, if there's any operation to run.</li><li>When it finds something, using func api, he call func and change the operation status in database: running state</li><li>Func, through func-transmit script, will call required minion creating an "async job" (the job id will be returned to RunnerJob and stored in database)</li><li>Another job, the ControllerJob, verifies if there is any running operation (contacting database) and, using stored job id, it asks to Func the state of that job</li><li>When it receives a "complete job" response (could be success or failed) store the information in database setting also the status to correct value (success/error)</li><li>User can see the result for the operation he called.<br /></li></ol>
