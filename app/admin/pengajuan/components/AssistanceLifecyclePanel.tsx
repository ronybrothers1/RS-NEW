import {
  and,
  eq,
  isNull,
  sql,
} from "drizzle-orm";
import Link from "next/link";

import {
  formatRupiah,
} from "@/lib/assistance";
import {
  db,
} from "@/src/db";
import {
  assistanceApplications,
  campaigns,
  financialTransactions,
} from "@/src/db/schema";

import AssistanceLifecycleActions from "./AssistanceLifecycleActions";

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

function toDateInput(
  value: Date | null,
) {
  if (!value) {
    return null;
  }

  return value
    .toISOString()
    .slice(
      0,
      10,
    );
}

export default async function AssistanceLifecyclePanel({
  applicationId,
  scheduledSuccess = false,
  completedSuccess = false,
}: {
  applicationId: string;
  scheduledSuccess?: boolean;
  completedSuccess?: boolean;
}) {
  const [
    application,
  ] =
    await db
      .select({
        id:
          assistanceApplications.id,
        status:
          assistanceApplications.status,
        requestedAmount:
          assistanceApplications.targetAmount,
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
        campaignStatus:
          campaigns.status,
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
        eq(
          assistanceApplications.id,
          applicationId,
        ),
      )
      .limit(1);

  if (
    !application ||
    application.status !==
      "APPROVED"
  ) {
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

  const fundingSource =
    hasCampaign
      ? "Kampanye"
      : "Kas Ruang Sejahtera";

  const scheduledDate =
    toDateInput(
      application.scheduledAt,
    );

  const completed =
    Boolean(
      application.completedAt,
    );

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Lifecycle Pelaksanaan
          </p>

          <h2 className="mt-1 text-lg font-bold text-teal-950">
            Pendanaan dan Pelaksanaan
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-teal-800">
            Keputusan pendanaan, jadwal, dan penyelesaian kegiatan dicatat pada pengajuan ini.
          </p>
        </div>

        {hasCampaign && (
          <Link
            href={`/admin/pengajuan/${application.id}/kampanye`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Kelola Kampanye Publik
          </Link>
        )}
      </div>

      {(scheduledSuccess ||
        completedSuccess) && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          {completedSuccess
            ? "Kegiatan berhasil ditandai telah dilaksanakan."
            : "Jadwal pelaksanaan berhasil disimpan."}
        </div>
      )}

      <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Nominal Diajukan
          </dt>
          <dd className="mt-2 font-bold text-slate-900">
            {formatRupiah(
              application.requestedAmount,
            )}
          </dd>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Bantuan Disetujui
          </dt>
          <dd className="mt-2 font-bold text-slate-900">
            {application.approvedAmount
              ? formatRupiah(
                  application.approvedAmount,
                )
              : "-"}
          </dd>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Biaya Operasional
          </dt>
          <dd className="mt-2 font-bold text-slate-900">
            {application.operationalAmount !==
            null
              ? formatRupiah(
                  application.operationalAmount,
                )
              : "-"}
          </dd>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Sumber Dana
          </dt>
          <dd className="mt-2 font-bold text-slate-900">
            {fundingSource}
          </dd>
        </div>
      </dl>

      {hasCampaign && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Target Kampanye
            </p>
            <p className="mt-2 font-bold text-slate-900">
              {formatRupiah(
                application.campaignTarget ||
                  "0",
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Dana Terkumpul
            </p>
            <p className="mt-2 font-bold text-slate-900">
              {formatRupiah(
                String(
                  collectedAmount,
                ),
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status Dana
            </p>
            <p
              className={`mt-2 font-bold ${
                campaignFunded
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {campaignFunded
                ? "Dana terpenuhi"
                : "Menunggu pemenuhan dana"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Kampanye:{" "}
              {application.campaignStatus}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Jadwal & Penyelesaian
          </p>

          <dl className="mt-3 space-y-2 text-sm">
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

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Pelaksanaan
              </dt>
              <dd className="text-right font-semibold text-slate-800">
                {application.completedAt
                  ? `Selesai ${formatDate(application.completedAt)}`
                  : "Belum selesai"}
              </dd>
            </div>
          </dl>
        </div>

        <AssistanceLifecycleActions
          applicationId={
            application.id
          }
          scheduledDate={
            scheduledDate
          }
          canSchedule={
            campaignFunded &&
            !completed
          }
          fundingBlocked={
            hasCampaign &&
            !campaignFunded
          }
          completed={
            completed
          }
        />
      </div>
    </section>
  );
}