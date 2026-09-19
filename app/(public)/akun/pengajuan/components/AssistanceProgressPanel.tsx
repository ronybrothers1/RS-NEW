import {
  and,
  eq,
  isNull,
  sql,
} from "drizzle-orm";

import {
  formatRupiah,
  type AssistanceApplicationStatus,
} from "@/lib/assistance";
import {
  formatAssistanceRegistrationNumber,
  getAssistanceProgress,
} from "@/lib/assistance-lifecycle";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  campaigns,
  financialTransactions,
} from "@/src/db/schema";

function formatDate(
  value: Date | null,
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      dateStyle:
        "medium",
    },
  ).format(value);
}

function BasicProgress({
  applicationId,
  status,
}: {
  applicationId: string;
  status:
    AssistanceApplicationStatus;
}) {
  const progress =
    getAssistanceProgress({
      status,
      hasCampaign:
        false,
      campaignFunded:
        false,
      scheduledAt:
        null,
      completedAt:
        null,
    });

  const registrationNumber =
    status === "DRAFT"
      ? null
      : formatAssistanceRegistrationNumber(
          applicationId,
        );

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Perkembangan Pengajuan
      </p>

      {registrationNumber && (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-500">
            Nomor Register Pengajuan
          </p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
            {registrationNumber}
          </p>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/80 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Posisi Saat Ini
        </p>
        <p className="mt-1 font-bold text-slate-900">
          {progress.label}
        </p>

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Tahap Berikutnya
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {progress.next}
        </p>
      </div>
    </section>
  );
}

export default async function AssistanceProgressPanel({
  applicationId,
  applicantId,
  status,
}: {
  applicationId: string;
  applicantId: string;
  status:
    AssistanceApplicationStatus;
}) {
  if (
    status !==
    "APPROVED"
  ) {
    return (
      <BasicProgress
        applicationId={
          applicationId
        }
        status={
          status
        }
      />
    );
  }

  const [
    application,
  ] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        approvedAmount:
          assistanceApplications.approvedAmount,
        operationalAmount:
          assistanceApplications.operationalAmount,
        scheduledAt:
          assistanceApplications.scheduledAt,
        completedAt:
          assistanceApplications.completedAt,
        campaignId:
          campaigns.id,
        campaignTarget:
          campaigns.targetAmount,
      })
      .from(
        assistanceApplications,
      )
      .leftJoin(
        campaigns,
        eq(
          campaigns.applicationId,
          assistanceApplications.id,
        ),
      )
      .where(
        and(
          eq(
            assistanceApplications.id,
            applicationId,
          ),
          eq(
            assistanceApplications.applicantId,
            applicantId,
          ),
        ),
      )
      .limit(1);

  if (!application) {
    return null;
  }

  let collectedAmount =
    0;

  if (
    application.campaignId
  ) {
    const [
      funding,
    ] =
      await db
        .select({
          totalIn:
            sql<string>`
              COALESCE(
                SUM(
                  CASE
                    WHEN ${financialTransactions.type} = 'IN'
                    THEN ${financialTransactions.amount}
                    ELSE 0
                  END
                ),
                0
              )::text
            `,
        })
        .from(
          financialTransactions,
        )
        .where(
          and(
            eq(
              financialTransactions.campaignId,
              application.campaignId,
            ),
            isNull(
              financialTransactions.deletedAt,
            ),
          ),
        );

    collectedAmount =
      Number(
        funding?.totalIn ||
          0,
      );
  }

  const campaignTarget =
    Number(
      application.campaignTarget ||
        0,
    );

  const hasCampaign =
    Boolean(
      application.campaignId,
    );

  const campaignFunded =
    !hasCampaign ||
    (
      campaignTarget >
        0 &&
      collectedAmount >=
        campaignTarget
    );

  const progress =
    getAssistanceProgress({
      status:
        application.status as
          AssistanceApplicationStatus,
      hasCampaign,
      campaignFunded,
      scheduledAt:
        application.scheduledAt,
      completedAt:
        application.completedAt,
    });

  const registrationNumber =
    formatAssistanceRegistrationNumber(
      application.id,
    );

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Perkembangan Pengajuan
      </p>

      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">
          Nomor Register Pengajuan
        </p>
        <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
          {registrationNumber}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/80 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Posisi Saat Ini
          </p>
          <p className="mt-1 font-bold text-slate-900">
            {progress.label}
          </p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tahap Berikutnya
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {progress.next}
          </p>
        </div>

        <div className="rounded-xl border border-white/80 bg-white p-4">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Sumber dana
              </dt>
              <dd className="text-right font-semibold text-slate-800">
                {hasCampaign
                  ? "Kampanye"
                  : "Kas Ruang Sejahtera"}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Bantuan disetujui
              </dt>
              <dd className="text-right font-semibold text-slate-800">
                {application.approvedAmount
                  ? formatRupiah(
                      application.approvedAmount,
                    )
                  : "-"}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Biaya operasional
              </dt>
              <dd className="text-right font-semibold text-slate-800">
                {application.operationalAmount !==
                null
                  ? formatRupiah(
                      application.operationalAmount,
                    )
                  : "-"}
              </dd>
            </div>

            {hasCampaign && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">
                    Dana kampanye
                  </dt>
                  <dd className="text-right font-semibold text-slate-800">
                    {formatRupiah(
                      String(
                        collectedAmount,
                      ),
                    )}
                    {" / "}
                    {formatRupiah(
                      application.campaignTarget ||
                        "0",
                    )}
                  </dd>
                </div>
              </>
            )}

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Jadwal
              </dt>
              <dd className="text-right font-semibold text-slate-800">
                {formatDate(
                  application.scheduledAt,
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}