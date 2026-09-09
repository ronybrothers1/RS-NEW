import {
  ArrowLeft,
  Megaphone,
  WalletCards,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  saveCampaign,
} from "@/app/actions/campaign";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  assistanceApplications,
  campaigns,
  programs,
} from "@/src/db/schema";

import CampaignEditorForm from "../../components/CampaignEditorForm";

export const dynamic =
  "force-dynamic";

export default async function AdminCampaignPage({
  params,
  searchParams,
}: {
  params:
    Promise<{
      id: string;
    }>;
  searchParams:
    Promise<{
      saved?: string;
    }>;
}) {
  const {
    id,
  } = await params;

  const [
    campaign,
  ] =
    await db
      .select({
        id:
          campaigns.id,
        applicationId:
          campaigns.applicationId,
        slug:
          campaigns.slug,
        title:
          campaigns.title,
        summary:
          campaigns.summary,
        story:
          campaigns.story,
        beneficiaryDisplayName:
          campaigns.beneficiaryDisplayName,
        publicLocation:
          campaigns.publicLocation,
        targetAmount:
          campaigns.targetAmount,
        coverPhotoId:
          campaigns.coverPhotoId,
        status:
          campaigns.status,
        programName:
          programs.name,
        applicationStatus:
          assistanceApplications.status,
      })
      .from(campaigns)
      .innerJoin(
        assistanceApplications,
        eq(
          campaigns.applicationId,
          assistanceApplications.id,
        ),
      )
      .innerJoin(
        programs,
        eq(
          campaigns.programId,
          programs.id,
        ),
      )
      .where(
        eq(
          campaigns.applicationId,
          id,
        ),
      )
      .limit(1);

  if (
    !campaign ||
    campaign.applicationStatus !==
      "APPROVED"
  ) {
    notFound();
  }

  const photos =
    await db
      .select({
        id:
          assistanceApplicationPhotos.id,
      })
      .from(
        assistanceApplicationPhotos,
      )
      .where(
        eq(
          assistanceApplicationPhotos.applicationId,
          id,
        ),
      )
      .orderBy(
        asc(
          assistanceApplicationPhotos.sortOrder,
        ),
      );

  const {
    saved,
  } =
    await searchParams;

  const action =
    saveCampaign.bind(
      null,
      id,
    );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/pengajuan/${id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Detail Pengajuan
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-700">
                Kampanye Publik · {campaign.programName}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Kelola “Bantu Mereka”
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Pengajuan sudah disetujui. Tinjau dan pisahkan informasi yang aman untuk publik sebelum kampanye diaktifkan.
              </p>
            </div>
          </div>

          <Link
            href={`/admin/keuangan/kampanye/${campaign.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <WalletCards className="mr-2 h-4 w-4 text-teal-700" />
            Lihat Keuangan
          </Link>
        </div>
      </div>

      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          Perubahan kampanye berhasil disimpan.
        </div>
      )}

      <CampaignEditorForm
        campaign={{
          slug:
            campaign.slug,
          title:
            campaign.title,
          summary:
            campaign.summary,
          story:
            campaign.story,
          beneficiaryDisplayName:
            campaign.beneficiaryDisplayName,
          publicLocation:
            campaign.publicLocation,
          targetAmount:
            campaign.targetAmount,
          coverPhotoId:
            campaign.coverPhotoId,
          status:
            campaign.status,
        }}
        photos={photos}
        action={action}
      />
    </div>
  );
}
